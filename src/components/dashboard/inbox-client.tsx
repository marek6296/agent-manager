"use client";

import { useState, useMemo } from "react";
import { FileText, MessageSquare, BarChart2, Zap, Mail, Inbox, Clock } from "lucide-react";
import type { Agent, AgentLog } from "@/lib/types";

interface SummaryEntry {
  id: string;
  subject: string;
  from: string;
  date: string;
  summary: string;
  created_at: string;
}

// Parse log message — handles new INBOX_DATA: JSON format and legacy format
function parseSummaryLog(log: AgentLog): SummaryEntry | null {
  try {
    if (log.message.startsWith("INBOX_DATA:")) {
      const json = JSON.parse(log.message.slice("INBOX_DATA:".length));
      return {
        id: log.id,
        subject: json.subject || "(no subject)",
        from: json.from || "",
        date: json.date || "",
        summary: json.summary || "",
        created_at: log.created_at,
      };
    }
    // Legacy: Summarized: "Subject" → summary
    if (log.message.startsWith("Summarized:")) {
      const arrow = log.message.indexOf(" → ");
      const subject = log.message.slice(13, arrow > 0 ? arrow : undefined).replace(/^"|"$/g, "");
      const summary = arrow > 0 ? log.message.slice(arrow + 3).replace(/\.\.\.$/, "") : "";
      return { id: log.id, subject, from: "", date: "", summary, created_at: log.created_at };
    }
  } catch { /* skip malformed */ }
  return null;
}

function getCapabilities(agent: Agent): string[] {
  const config = (agent.config_json || {}) as Record<string, unknown>;
  if (Array.isArray(config.capabilities)) return config.capabilities as string[];
  if (agent.type === "email_summarizer") return ["summarize"];
  if (agent.type === "email_auto_reply") return ["auto_reply"];
  if (agent.type === "data_analyzer") return ["analyze"];
  return ["summarize"];
}

const capIcons: Record<string, { icon: typeof FileText; color: string; label: string }> = {
  summarize: { icon: FileText, color: "text-emerald-400", label: "Summaries" },
  suggest_reply: { icon: MessageSquare, color: "text-blue-400", label: "Replies" },
  analyze: { icon: BarChart2, color: "text-amber-400", label: "Analysis" },
  auto_reply: { icon: Zap, color: "text-red-400", label: "Auto-reply" },
};

export function InboxClient({ agents, allLogs }: { agents: Agent[]; allLogs: AgentLog[] }) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || "");
  const [selectedEntry, setSelectedEntry] = useState<SummaryEntry | null>(null);

  // Group logs by agent
  const logsByAgent = useMemo(() => {
    const map: Record<string, AgentLog[]> = {};
    for (const log of allLogs) {
      if (!map[log.agent_id]) map[log.agent_id] = [];
      map[log.agent_id].push(log);
    }
    return map;
  }, [allLogs]);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);
  const caps = selectedAgent ? getCapabilities(selectedAgent) : [];
  const agentLogs = selectedAgentId ? (logsByAgent[selectedAgentId] || []) : [];

  const summaryEntries = useMemo(
    () => agentLogs.map(parseSummaryLog).filter(Boolean) as SummaryEntry[],
    [agentLogs]
  );

  const formatFrom = (from: string) => {
    const match = from.match(/<(.+)>/);
    return match ? match[1] : from;
  };
  const formatName = (from: string) => {
    const nameMatch = from.match(/^([^<]+)</);
    return nameMatch ? nameMatch[1].trim() : from.split("@")[0];
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-0 -m-6 overflow-hidden">
      {/* Agent list sidebar */}
      <div className="w-64 shrink-0 border-r border-zinc-800 bg-zinc-950/50 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-zinc-200">Inbox</h2>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">Agent outputs</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {agents.map((agent) => {
            const agentCaps = getCapabilities(agent);
            const count = (logsByAgent[agent.id] || []).filter(
              (l) => l.message.startsWith("INBOX_DATA:") || l.message.startsWith("Summarized:")
            ).length;
            const isActive = agent.id === selectedAgentId;

            return (
              <button
                key={agent.id}
                onClick={() => { setSelectedAgentId(agent.id); setSelectedEntry(null); }}
                className={`w-full text-left p-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-violet-600/15 border border-violet-500/20"
                    : "hover:bg-zinc-800/50 border border-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? "text-violet-200" : "text-zinc-300"}`}>
                      {agent.name}
                    </p>
                    {/* Capability icons */}
                    <div className="flex items-center gap-1 mt-1.5">
                      {agentCaps.map((cap) => {
                        const info = capIcons[cap];
                        if (!info) return null;
                        return (
                          <div key={cap} title={info.label} className="flex items-center">
                            <info.icon className={`w-3 h-3 ${info.color}`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${
                      isActive ? "bg-violet-600/30 text-violet-300" : "bg-zinc-800 text-zinc-400"
                    }`}>
                      {count}
                    </span>
                  )}
                </div>
                <div className={`flex items-center gap-1 mt-1.5 text-[10px] ${isActive ? "text-violet-400/60" : "text-zinc-600"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${agent.status === "running" ? "bg-emerald-400" : "bg-zinc-600"}`} />
                  {agent.status}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content — split view */}
      {selectedAgent ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Email list — left column */}
          <div className="w-80 shrink-0 border-r border-zinc-800 bg-zinc-950/30 flex flex-col">
            <div className="p-4 border-b border-zinc-800">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Emails</p>
              <p className="text-sm font-medium text-zinc-300 mt-0.5">{summaryEntries.length} processed</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {summaryEntries.length > 0 ? (
                <div className="divide-y divide-zinc-800/50">
                  {summaryEntries.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
                      className={`w-full text-left px-4 py-3.5 hover:bg-zinc-800/40 transition-all ${
                        selectedEntry?.id === entry.id ? "bg-zinc-800/60 border-l-2 border-violet-500" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-base shrink-0 mt-0.5">📧</span>
                        <div className="min-w-0">
                          {entry.from && (
                            <p className="text-xs font-semibold text-zinc-300 truncate">
                              {formatName(entry.from)}
                            </p>
                          )}
                          <p className="text-xs text-zinc-300 font-medium truncate mt-0.5">
                            {entry.subject}
                          </p>
                          {entry.summary && (
                            <p className="text-[11px] text-zinc-600 line-clamp-2 mt-1 leading-relaxed">
                              {entry.summary.substring(0, 80)}...
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-1.5">
                            <Clock className="w-2.5 h-2.5 text-zinc-700" />
                            <p className="text-[10px] text-zinc-600">
                              {new Date(entry.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                  <Mail className="w-8 h-8 text-zinc-700 mb-3" />
                  <p className="text-zinc-500 text-sm">No emails yet</p>
                  <p className="text-zinc-600 text-xs mt-1">Run the agent to process your inbox</p>
                </div>
              )}
            </div>
          </div>

          {/* Summary detail — right panel */}
          <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950/10">
            {selectedEntry ? (
              <>
                {/* Email header */}
                <div className="p-6 border-b border-zinc-800">
                  <h1 className="text-lg font-semibold text-zinc-100 mb-2">{selectedEntry.subject}</h1>
                  {selectedEntry.from && (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-300">
                        {formatName(selectedEntry.from).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-zinc-300 font-medium">{formatName(selectedEntry.from)}</p>
                        <p className="text-xs text-zinc-500">{formatFrom(selectedEntry.from)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Summary */}
                <div className="flex-1 overflow-y-auto p-6">
                  {caps.includes("summarize") && selectedEntry.summary && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <h2 className="text-sm font-semibold text-zinc-300">AI Summary</h2>
                      </div>
                      <div className="bg-emerald-600/5 border border-emerald-500/20 rounded-xl p-4">
                        <p className="text-sm text-zinc-300 leading-relaxed">{selectedEntry.summary}</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-4">
                  <Mail className="w-7 h-7 text-zinc-600" />
                </div>
                <p className="text-zinc-400 font-medium">Select an email</p>
                <p className="text-sm text-zinc-600 mt-1">Click any email on the left to see the AI summary</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500">Select an agent</p>
        </div>
      )}
    </div>
  );
}
