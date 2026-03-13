"use client";

import { toggleAgentStatus, deleteAgent } from "@/services/agents/actions";
import { Button } from "@/components/ui/button";
import { Play, Square, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Agent } from "@/lib/types";

export function AgentDetailActions({ agent }: { agent: Agent }) {
  const router = useRouter();

  const handleToggle = async () => {
    await toggleAgentStatus(agent.id, agent.status === "running" ? "stopped" : "running");
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this agent?")) {
      await deleteAgent(agent.id);
      router.push("/agents");
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleToggle}
        className={agent.status === "running"
          ? "bg-amber-600 hover:bg-amber-700"
          : "bg-emerald-600 hover:bg-emerald-700"
        }
      >
        {agent.status === "running" ? (
          <><Square className="w-4 h-4 mr-2" /> Stop Agent</>
        ) : (
          <><Play className="w-4 h-4 mr-2" /> Start Agent</>
        )}
      </Button>
      <Button variant="destructive" onClick={handleDelete}>
        <Trash2 className="w-4 h-4 mr-2" /> Delete
      </Button>
    </div>
  );
}
