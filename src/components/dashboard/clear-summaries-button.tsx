"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { clearAgentSummaries } from "@/services/agents/actions";

export function ClearSummariesButton({ agentId }: { agentId: string }) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleClick = async () => {
    if (!confirmed) {
      setConfirmed(true);
      setTimeout(() => setConfirmed(false), 3000);
      return;
    }
    setLoading(true);
    try {
      await clearAgentSummaries(agentId);
    } finally {
      setLoading(false);
      setConfirmed(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all ${
        confirmed
          ? "bg-red-600/20 text-red-300 border border-red-500/30"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
      }`}
      title="Clear all summaries"
    >
      <Trash2 className="w-3.5 h-3.5" />
      {loading ? "Clearing..." : confirmed ? "Confirm clear?" : "Clear"}
    </button>
  );
}
