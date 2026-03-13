// Agent Runner - Background Worker System
// Scans for active agents and executes them periodically
// Tracks last_run_at per agent to only process NEW emails

import { createClient } from "@supabase/supabase-js";
import { generateText, summarize, generateReply } from "@/lib/ai";
import { getInboxMessages, sendEmail, refreshAccessToken } from "@/lib/integrations/gmail";
import type { Agent } from "@/lib/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Update agent's last_run_at in config_json
async function updateLastRunAt(agentId: string, configJson: Record<string, unknown>) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  await supabase.from("agents").update({
    config_json: { ...configJson, last_run_at: new Date().toISOString() },
    updated_at: new Date().toISOString(),
  }).eq("id", agentId);
}

async function getGmailTokens(userId: string): Promise<{ accessToken: string } | null> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: integration } = await supabase
    .from("integrations")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "gmail")
    .eq("connected", true)
    .single();

  if (!integration) return null;

  let accessToken = integration.access_token;

  // Refresh token if expired
  if (new Date(integration.token_expiry) < new Date()) {
    try {
      const tokens = await refreshAccessToken(integration.refresh_token);
      accessToken = tokens.access_token;
      await supabase.from("integrations").update({
        access_token: tokens.access_token,
        token_expiry: new Date(tokens.expiry_date).toISOString(),
      }).eq("id", integration.id);
    } catch (err) {
      console.error("Failed to refresh token:", err);
      return null;
    }
  }

  return { accessToken };
}

async function executeMultiCapabilityAgent(agent: Agent) {
  const tokens = await getGmailTokens(agent.user_id);
  if (!tokens) {
    await logAgentActivity(agent.id, "error", "Gmail not connected");
    return;
  }

  const config = (agent.config_json || {}) as Record<string, unknown>;
  const lastRunAt = config.last_run_at ? new Date(config.last_run_at as string) : undefined;
  const skipAutomated = config.skip_automated !== false;
  // Get capabilities from config, or fall back to legacy type
  const caps: string[] = Array.isArray(config.capabilities)
    ? (config.capabilities as string[])
    : agent.type === "email_summarizer" ? ["summarize"]
    : agent.type === "email_auto_reply" ? ["auto_reply"]
    : agent.type === "data_analyzer" ? ["analyze"]
    : ["summarize"];

  const afterLabel = lastRunAt ? ` since ${lastRunAt.toLocaleTimeString()}` : " (first run)";
  const messages = await getInboxMessages(tokens.accessToken, 5, lastRunAt, skipAutomated);

  if (messages.length === 0) {
    await logAgentActivity(agent.id, "info", `No new emails${afterLabel}`);
    await updateLastRunAt(agent.id, config);
    return;
  }

  await logAgentActivity(agent.id, "info", `Processing ${messages.length} email(s) with capabilities: ${caps.join(", ")}`);

  for (const msg of messages) {
    const emailContext = `Subject: ${msg.subject}\nFrom: ${msg.from}\nBody: ${msg.body.substring(0, 2000)}`;

    // — SUMMARIZE —
    if (caps.includes("summarize")) {
      try {
        const summary = await summarize(emailContext);
        await logAgentActivity(agent.id, "success",
          `Summarized: "${msg.subject}" → ${summary.substring(0, 300)}...`
        );
      } catch (err) {
        await logAgentActivity(agent.id, "error", `Summarize failed: ${err instanceof Error ? err.message : "Unknown"}`);
      }
    }

    // — ANALYZE —
    if (caps.includes("analyze")) {
      try {
        const analysis = await generateText(
          `Analyze this email and provide: 1) Priority (High/Medium/Low), 2) Sentiment, 3) Key action items, 4) Category.\n\n${emailContext}`,
          "You are an email analyst. Be concise and structured."
        );
        await logAgentActivity(agent.id, "info",
          `Analyzed: "${msg.subject}" → ${analysis.substring(0, 300)}...`
        );
      } catch (err) {
        await logAgentActivity(agent.id, "error", `Analyze failed: ${err instanceof Error ? err.message : "Unknown"}`);
      }
    }

    // — SUGGEST REPLY (pending approval) —
    if (caps.includes("suggest_reply")) {
      try {
        const draft = await generateReply(emailContext, agent.prompt || "Write a professional reply.");
        // Store as pending_reply — user must approve before sending
        const pendingData = JSON.stringify({
          to: msg.from,
          subject: `Re: ${msg.subject}`,
          original_subject: msg.subject,
          reply: draft,
        });
        await logAgentActivity(agent.id, "pending_reply", pendingData);
        await logAgentActivity(agent.id, "info",
          `💬 Reply draft ready for: "${msg.subject}" — waiting for your approval`
        );
      } catch (err) {
        await logAgentActivity(agent.id, "error", `Suggest reply failed: ${err instanceof Error ? err.message : "Unknown"}`);
      }
    }

    // — AUTO REPLY (sends immediately) —
    if (caps.includes("auto_reply") && !caps.includes("suggest_reply")) {
      try {
        const reply = await generateReply(emailContext, agent.prompt || "Write a professional reply.");
        await sendEmail(tokens.accessToken, msg.from, `Re: ${msg.subject}`, reply);
        await logAgentActivity(agent.id, "success", `Auto-replied to: "${msg.subject}" from ${msg.from}`);
      } catch (err) {
        await logAgentActivity(agent.id, "error", `Auto-reply failed: ${err instanceof Error ? err.message : "Unknown"}`);
      }
    }
  }

  await updateLastRunAt(agent.id, config);
}

async function logAgentActivity(agentId: string, level: string, message: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  await supabase.from("agent_logs").insert({
    agent_id: agentId,
    level,
    message,
  });
}

export async function runAgentCycle() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch all running agents
  const { data: agents } = await supabase
    .from("agents")
    .select("*")
    .eq("status", "running");

  if (!agents || agents.length === 0) {
    console.log("[AgentRunner] No active agents");
    return;
  }

  console.log(`[AgentRunner] Processing ${agents.length} active agents...`);

  for (const agent of agents as Agent[]) {
    // Log cycle start so it's always visible in /logs
    await logAgentActivity(agent.id, "info", `⚡ Cycle started`);

    try {
      await executeMultiCapabilityAgent(agent);
      await logAgentActivity(agent.id, "info", `✅ Cycle completed`);
    } catch (err) {
      console.error(`[AgentRunner] Error executing agent ${agent.id}:`, err);
      await supabase.from("agents").update({ status: "error" }).eq("id", agent.id);
      await logAgentActivity(agent.id, "error", `Agent crashed: ${err instanceof Error ? err.message : "Unknown"}`);
    }
  }
}

// Worker entry point - runs in background
export async function startAgentWorker(intervalMs: number = 60000) {
  console.log(`[AgentWorker] Starting agent worker with ${intervalMs}ms interval`);

  const runCycle = async () => {
    try {
      await runAgentCycle();
    } catch (err) {
      console.error("[AgentWorker] Cycle error:", err);
    }
  };

  // Initial run
  await runCycle();

  // Periodic execution
  setInterval(runCycle, intervalMs);
}
