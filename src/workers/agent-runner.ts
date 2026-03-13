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

async function logAgentActivity(agentId: string, level: string, message: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  await supabase.from("agent_logs").insert({
    agent_id: agentId,
    level,
    message,
  });
}

async function executeEmailSummarizer(agent: Agent) {
  const tokens = await getGmailTokens(agent.user_id);
  if (!tokens) {
    await logAgentActivity(agent.id, "error", "Gmail not connected");
    return;
  }

  try {
    const messages = await getInboxMessages(tokens.accessToken, 5);
    if (messages.length === 0) {
      await logAgentActivity(agent.id, "info", "No new emails to summarize");
      return;
    }

    for (const msg of messages) {
      const summary = await summarize(
        `Subject: ${msg.subject}\nFrom: ${msg.from}\nBody: ${msg.body}`,
      );
      await logAgentActivity(
        agent.id,
        "success",
        `Summarized: "${msg.subject}" → ${summary.substring(0, 200)}...`
      );
    }
  } catch (err) {
    await logAgentActivity(agent.id, "error", `Error: ${err instanceof Error ? err.message : "Unknown"}`);
  }
}

async function executeEmailAutoReply(agent: Agent) {
  const tokens = await getGmailTokens(agent.user_id);
  if (!tokens) {
    await logAgentActivity(agent.id, "error", "Gmail not connected");
    return;
  }

  try {
    const messages = await getInboxMessages(tokens.accessToken, 3);
    if (messages.length === 0) {
      await logAgentActivity(agent.id, "info", "No emails to reply to");
      return;
    }

    for (const msg of messages) {
      const reply = await generateReply(
        `Subject: ${msg.subject}\nFrom: ${msg.from}\nBody: ${msg.body}`,
        agent.prompt || "Generate a professional, helpful reply."
      );

      await sendEmail(
        tokens.accessToken,
        msg.from,
        `Re: ${msg.subject}`,
        reply
      );

      await logAgentActivity(
        agent.id,
        "success",
        `Auto-replied to: "${msg.subject}" from ${msg.from}`
      );
    }
  } catch (err) {
    await logAgentActivity(agent.id, "error", `Error: ${err instanceof Error ? err.message : "Unknown"}`);
  }
}

async function executeDataAnalyzer(agent: Agent) {
  try {
    const prompt = agent.prompt || "Analyze the following data and provide insights:";
    const result = await generateText(
      prompt,
      "You are a data analyst. Provide clear, actionable insights."
    );
    await logAgentActivity(agent.id, "success", `Analysis complete: ${result.substring(0, 300)}...`);
  } catch (err) {
    await logAgentActivity(agent.id, "error", `Error: ${err instanceof Error ? err.message : "Unknown"}`);
  }
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
    try {
      switch (agent.type) {
        case "email_summarizer":
          await executeEmailSummarizer(agent);
          break;
        case "email_auto_reply":
          await executeEmailAutoReply(agent);
          break;
        case "data_analyzer":
          await executeDataAnalyzer(agent);
          break;
        default:
          await logAgentActivity(agent.id, "warning", `Unknown agent type: ${agent.type}`);
      }
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
