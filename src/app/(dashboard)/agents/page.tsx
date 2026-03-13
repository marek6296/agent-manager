import { createClient } from "@/lib/supabase/server";
import { CreateAgentDialog } from "@/components/dashboard/create-agent-dialog";
import { AgentCard } from "@/components/dashboard/agent-card";
import { Bot } from "lucide-react";
import type { Agent, Integration } from "@/lib/types";

export default async function AgentsPage() {
  const supabase = await createClient();

  const [{ data: agents }, { data: integrations }] = await Promise.all([
    supabase.from("agents").select("*").order("created_at", { ascending: false }),
    supabase.from("integrations").select("*"),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Agents</h1>
          <p className="text-zinc-400 mt-1">Create and manage your AI agents</p>
        </div>
        <CreateAgentDialog integrations={(integrations as Integration[]) || []} />
      </div>

      {agents && agents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(agents as Agent[]).map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
            <Bot className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-300 mb-2">No agents yet</h3>
          <p className="text-sm text-zinc-500 max-w-sm">
            Create your first AI agent to start automating tasks. Agents can summarize emails, auto-reply, and analyze data.
          </p>
        </div>
      )}
    </div>
  );
}
