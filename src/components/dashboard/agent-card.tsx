"use client";

import { toggleAgentStatus, deleteAgent } from "@/services/agents/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Play, Square, Trash2, ChevronRight, Clock, Cpu, Zap } from "lucide-react";
import Link from "next/link";
import type { Agent } from "@/lib/types";

function getAgentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    email_summarizer: "Email Summarizer",
    email_auto_reply: "Auto Reply",
    data_analyzer: "Data Analyzer",
    custom: "Custom",
  };
  return labels[type] || type;
}

function getAgentTypeIcon(type: string) {
  const icons: Record<string, typeof Bot> = {
    email_summarizer: Cpu,
    email_auto_reply: Zap,
    data_analyzer: Cpu,
    custom: Bot,
  };
  const Icon = icons[type] || Bot;
  return <Icon className="w-5 h-5" />;
}

export function AgentCard({ agent }: { agent: Agent }) {
  const handleToggle = async () => {
    await toggleAgentStatus(agent.id, agent.status === "running" ? "stopped" : "running");
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this agent?")) {
      await deleteAgent(agent.id);
    }
  };

  return (
    <Card className={`group hover:border-zinc-700 transition-all duration-300 ${
      agent.status === "running" ? "border-emerald-500/20 bg-emerald-600/5" :
      agent.status === "error" ? "border-red-500/20 bg-red-600/5" :
      ""
    }`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${
              agent.status === "running" ? "bg-emerald-600/15 text-emerald-400" :
              agent.status === "error" ? "bg-red-600/15 text-red-400" :
              "bg-zinc-800 text-zinc-400"
            }`}>
              {getAgentTypeIcon(agent.type)}
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100">{agent.name}</h3>
              <p className="text-xs text-zinc-500">{getAgentTypeLabel(agent.type)}</p>
            </div>
          </div>
          <Badge variant={
            agent.status === "running" ? "success" :
            agent.status === "error" ? "destructive" : "secondary"
          }>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
              agent.status === "running" ? "bg-emerald-400 animate-pulse" :
              agent.status === "error" ? "bg-red-400" :
              "bg-zinc-500"
            }`} />
            {agent.status}
          </Badge>
        </div>

        {agent.prompt && (
          <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{agent.prompt}</p>
        )}

        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-4">
          <Clock className="w-3.5 h-3.5" />
          <span>{agent.schedule}</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              className={agent.status === "running" ? "text-amber-400 hover:text-amber-300" : "text-emerald-400 hover:text-emerald-300"}
            >
              {agent.status === "running" ? (
                <><Square className="w-3.5 h-3.5 mr-1" /> Stop</>
              ) : (
                <><Play className="w-3.5 h-3.5 mr-1" /> Start</>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-400 hover:text-red-300">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
          <Link href={`/agents/${agent.id}`}>
            <Button variant="ghost" size="sm" className="text-zinc-400">
              Details <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
