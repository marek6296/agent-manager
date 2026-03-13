import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InboxClient } from "@/components/dashboard/inbox-client";
import type { Agent, AgentLog } from "@/lib/types";

export default async function InboxPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch all agents that have email capabilities
  const { data: agents } = await supabase
    .from("agents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!agents || agents.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-zinc-300 font-medium">No agents yet</p>
          <p className="text-sm text-zinc-500 mt-1">Create an agent first to see results here.</p>
        </div>
      </div>
    );
  }

  // Fetch logs for all agents
  const agentIds = agents.map((a) => a.id);
  const { data: allLogs } = await supabase
    .from("agent_logs")
    .select("*")
    .in("agent_id", agentIds)
    .eq("level", "success")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <InboxClient
      agents={agents as Agent[]}
      allLogs={(allLogs as AgentLog[]) || []}
    />
  );
}
