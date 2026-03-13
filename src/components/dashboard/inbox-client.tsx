"use client";

import { useState, useEffect, useMemo } from "react";
import { RefreshCw, FileText, Inbox, Sparkles, Clock } from "lucide-react";
import type { Agent, AgentLog } from "@/lib/types";

interface GmailEmail {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  isUnread: boolean;
}

interface SummaryEntry {
  id: string;
  subject: string;
  from: string;
  summary: string;
  created_at: string;
}

function parseSummaryLog(log: AgentLog): SummaryEntry | null {
  try {
    if (log.message.startsWith("INBOX_DATA:")) {
      const d = JSON.parse(log.message.slice("INBOX_DATA:".length));
      return { id: log.id, subject: d.subject || "(no subject)", from: d.from || "", summary: d.summary || "", created_at: log.created_at };
    }
    if (log.message.startsWith("Summarized:")) {
      const arrow = log.message.indexOf(" → ");
      return {
        id: log.id,
        subject: log.message.slice(13, arrow > 0 ? arrow : undefined).replace(/^"|"$/g, ""),
        from: "",
        summary: arrow > 0 ? log.message.slice(arrow + 3).replace(/\.\.\.$/, "") : "",
        created_at: log.created_at,
      };
    }
  } catch { /* skip */ }
  return null;
}

function getInitials(from: string) {
  const nameMatch = from.match(/^([^<]+)</);
  const name = nameMatch ? nameMatch[1].trim() : from.split("@")[0];
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function getSenderName(from: string) {
  const nameMatch = from.match(/^([^<]+)</);
  return nameMatch ? nameMatch[1].trim() : from.split("@")[0];
}

function formatTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = diffMs / 3600000;
    if (diffH < 24) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffH < 168) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { day: "numeric", month: "short" });
  } catch { return ""; }
}

// Pastel avatar colors based on first char
const avatarColors = [
  "bg-violet-600/30 text-violet-300 border-violet-500/30",
  "bg-blue-600/30 text-blue-300 border-blue-500/30",
  "bg-emerald-600/30 text-emerald-300 border-emerald-500/30",
  "bg-amber-600/30 text-amber-300 border-amber-500/30",
  "bg-pink-600/30 text-pink-300 border-pink-500/30",
  "bg-cyan-600/30 text-cyan-300 border-cyan-500/30",
];
function avatarColor(from: string) {
  const code = (from?.charCodeAt(0) || 0) % avatarColors.length;
  return avatarColors[code];
}

export function InboxClient({ agents, allLogs }: { agents: Agent[]; allLogs: AgentLog[] }) {
  const [emails, setEmails] = useState<GmailEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent>(agents[0]);
  const [selectedEmail, setSelectedEmail] = useState<GmailEmail | null>(null);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inbox/emails");
      const data = await res.json();
      setEmails(data.emails || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmails(); }, []);

  // Get summaries for selected agent
  const agentLogs = useMemo(
    () => allLogs.filter(l => l.agent_id === selectedAgent?.id),
    [allLogs, selectedAgent]
  );
  const summaries = useMemo(
    () => agentLogs
      .filter(l => l.level === "success")
      .map(parseSummaryLog)
      .filter(Boolean) as SummaryEntry[],
    [agentLogs]
  );

  const hasGmail = agents.some(a => a.type?.includes("email") || (
    (a.config_json as Record<string, unknown>)?.capabilities as string[] | undefined
  )?.some(c => ["summarize", "suggest_reply", "auto_reply"].includes(c)));

  return (
    <div className="flex h-[calc(100vh-64px)] -mx-6 -my-6 overflow-hidden">

      {/* ── Column 1: All inbox emails ── */}
      <div className="w-[380px] shrink-0 border-r border-zinc-800 flex flex-col bg-zinc-950">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <Inbox className="w-4 h-4 text-zinc-400" />
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">All Emails</h2>
              <p className="text-[11px] text-zinc-600">{emails.length} messages</p>
            </div>
          </div>
          <button
            onClick={fetchEmails}
            disabled={loading}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Email list */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/40">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-3 px-4 py-3.5 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-zinc-800 rounded w-1/2" />
                  <div className="h-2.5 bg-zinc-800/60 rounded w-3/4" />
                  <div className="h-2 bg-zinc-800/40 rounded w-full" />
                </div>
              </div>
            ))
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <Inbox className="w-8 h-8 text-zinc-700 mb-3" />
              <p className="text-zinc-500 text-sm">No emails found</p>
              <p className="text-zinc-600 text-xs mt-1">Make sure Gmail is connected in Integrations</p>
            </div>
          ) : emails.map((email) => {
            const initials = getInitials(email.from);
            const name = getSenderName(email.from);
            const colorClass = avatarColor(email.from);
            const isSelected = selectedEmail?.id === email.id;

            return (
              <button
                key={email.id}
                onClick={() => setSelectedEmail(isSelected ? null : email)}
                className={`w-full text-left flex gap-3 px-4 py-3.5 transition-all group ${
                  isSelected
                    ? "bg-violet-600/10 border-l-[3px] border-l-violet-500"
                    : "hover:bg-zinc-900/60 border-l-[3px] border-l-transparent"
                }`}
              >
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${colorClass}`}>
                  {initials}
                </div>
                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <p className={`text-xs font-semibold truncate ${email.isUnread ? "text-zinc-100" : "text-zinc-400"}`}>
                      {name}
                    </p>
                    <span className="text-[10px] text-zinc-600 shrink-0">{formatTime(email.date)}</span>
                  </div>
                  <p className={`text-xs truncate mb-1 ${email.isUnread ? "text-zinc-300 font-medium" : "text-zinc-500"}`}>
                    {email.subject}
                  </p>
                  <p className="text-[11px] text-zinc-600 line-clamp-2 leading-relaxed">
                    {email.snippet}
                  </p>
                </div>
                {email.isUnread && (
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0 mt-1.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Column 2: Agent Summaries ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950/50">
        {/* Header with agent switcher */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 gap-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">AI Summaries</h2>
              <p className="text-[11px] text-zinc-600">{summaries.length} processed by agent</p>
            </div>
          </div>
          {/* Agent selector */}
          {agents.length > 1 && (
            <div className="flex items-center gap-1">
              {agents.map(a => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAgent(a)}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                    selectedAgent?.id === a.id
                      ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Summary cards */}
        <div className="flex-1 overflow-y-auto p-5">
          {summaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-emerald-400 opacity-50" />
              </div>
              <p className="text-zinc-300 font-medium mb-1">No summaries yet</p>
              <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
                Start <span className="text-violet-400">{selectedAgent?.name}</span> and click{" "}
                <span className="text-violet-400">Run Now</span> to process your inbox.
                Only real emails (no newsletters) will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-w-2xl">
              {summaries.map((entry) => {
                const initials = entry.from ? getInitials(entry.from) : "✉";
                const name = entry.from ? getSenderName(entry.from) : "";
                const colorClass = entry.from ? avatarColor(entry.from) : "bg-zinc-800 text-zinc-400 border-zinc-700";

                return (
                  <div
                    key={entry.id}
                    className="group flex gap-4 p-4 rounded-2xl border border-zinc-800 hover:border-emerald-500/20 bg-zinc-900/40 hover:bg-emerald-600/5 transition-all duration-200"
                  >
                    {/* Sender avatar */}
                    <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${colorClass}`}>
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      {/* Meta */}
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <div className="min-w-0">
                          {name && <p className="text-xs text-zinc-500 mb-0.5">{name}</p>}
                          <p className="text-sm font-semibold text-zinc-100 truncate">{entry.subject}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 text-zinc-700">
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px]">{formatTime(entry.created_at)}</span>
                        </div>
                      </div>
                      {/* Divider */}
                      <div className="flex items-center gap-2 my-2">
                        <div className="h-px flex-1 bg-zinc-800" />
                        <span className="text-[10px] text-emerald-400/60 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> AI Summary
                        </span>
                        <div className="h-px flex-1 bg-zinc-800" />
                      </div>
                      {/* Summary */}
                      <p className="text-sm text-zinc-300 leading-relaxed">{entry.summary}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
