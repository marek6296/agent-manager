"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function createAgent(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const prompt = formData.get("prompt") as string;
  const schedule = formData.get("schedule") as string || "*/5 * * * *";
  const integrationId = formData.get("integration_id") as string || null;

  const { error } = await supabase.from("agents").insert({
    user_id: user.id,
    name,
    type,
    prompt,
    schedule,
    integration_id: integrationId || null,
    status: "stopped",
    config_json: {},
  });

  if (error) throw new Error(error.message);
  revalidatePath("/agents");
}

export async function createAgentMulti(data: {
  name: string;
  prompt: string;
  schedule: string;
  integration_id: string | null;
  capabilities: string[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Determine primary type for backward compat
  const primaryType = data.capabilities.includes("summarize")
    ? "email_summarizer"
    : data.capabilities.includes("auto_reply")
    ? "email_auto_reply"
    : data.capabilities.includes("analyze")
    ? "data_analyzer"
    : "custom";

  const { error } = await supabase.from("agents").insert({
    user_id: user.id,
    name: data.name,
    type: primaryType,
    prompt: data.prompt,
    schedule: data.schedule,
    integration_id: data.integration_id,
    status: "stopped",
    config_json: {
      capabilities: data.capabilities,
      skip_automated: true,
    },
  });

  if (error) throw new Error(error.message);
  revalidatePath("/agents");
}


export async function updateAgent(id: string, data: { name?: string; type?: string; prompt?: string; schedule?: string; integration_id?: string | null }) {
  const supabase = await createClient();

  const { error } = await supabase.from("agents").update({
    ...data,
    updated_at: new Date().toISOString(),
  }).eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/agents");
  revalidatePath(`/agents/${id}`);
}

export async function setAgentStartPoint(
  id: string,
  startFrom: string | null,
  currentConfig: Record<string, unknown>
) {
  const supabase = await createClient();

  const newConfig = {
    ...currentConfig,
    // null means "process all unread", a date string means "only after this time"
    last_run_at: startFrom,
  };

  const { error } = await supabase.from("agents").update({
    config_json: newConfig,
    updated_at: new Date().toISOString(),
  }).eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/agents");
}

export async function toggleAgentStatus(id: string, newStatus: "running" | "stopped") {
  const supabase = await createClient();

  const { error } = await supabase.from("agents").update({
    status: newStatus,
    updated_at: new Date().toISOString(),
  }).eq("id", id);

  if (error) throw new Error(error.message);

  // Log the status change
  await supabase.from("agent_logs").insert({
    agent_id: id,
    level: "info",
    message: `Agent ${newStatus === "running" ? "started" : "stopped"}`,
  });

  revalidatePath("/agents");
  revalidatePath(`/agents/${id}`);
  revalidatePath("/dashboard");
}

export async function deleteAgent(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("agents").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/agents");
  revalidatePath("/dashboard");
}

export async function clearAgentSummaries(agentId: string) {
  // Verify the user owns this agent
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: agent } = await supabase
    .from("agents")
    .select("id, config_json")
    .eq("id", agentId)
    .eq("user_id", user.id)
    .single();
  if (!agent) throw new Error("Agent not found or unauthorized");

  // Use admin client to bypass RLS for the delete
  const admin = createAdminClient(supabaseUrl, supabaseServiceKey);
  const { error } = await admin
    .from("agent_logs")
    .delete()
    .eq("agent_id", agentId);

  if (error) throw new Error(error.message);

  // Reset last_run_at to 48h ago → next run will reprocess recent emails
  const config = ((agent.config_json as Record<string, unknown>) || {});
  const newConfig = {
    ...config,
    last_run_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  };
  await admin.from("agents").update({ config_json: newConfig }).eq("id", agentId);

  revalidatePath(`/agents/${agentId}`);
  revalidatePath("/agents");
}
