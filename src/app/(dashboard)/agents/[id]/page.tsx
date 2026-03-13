import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Clock, Cpu, ArrowLeft, Activity, Info, Mail } from "lucide-react";
import Link from "next/link";
import { AgentDetailActions } from "@/components/dashboard/agent-detail-actions";
import { RunNowButton } from "@/components/dashboard/run-now-button";
import type { Agent, AgentLog } from "@/lib/types";

const agentTypeInfo: Record<string, { what: string; how: string; promptLabel: string }> = {
  email_summarizer: {
    what: "Reads your unread emails and creates AI summaries",
    how: "Every cycle: fetches unread Gmail → runs each email through AI → logs summary to /logs",
    promptLabel: "Custom summary instructions (e.g. 'highlight deadlines and action items')",
  },
  email_auto_reply: {
    what: "Automatically replies to new emails using AI",
    how: "Every cycle: fetches unread Gmail → generates AI reply using your prompt → sends reply via Gmail",
    promptLabel: "Reply tone/style (e.g. 'professional and concise, always offer a meeting')",
  },
  data_analyzer: {
    what: "Runs AI analysis based on your custom prompt",
    how: "Every cycle: sends your prompt to AI → logs the result to /logs",
    promptLabel: "Analysis prompt (e.g. 'Summarize key business trends from the data')",
  },
  custom: {
    what: "Custom AI agent",
    how: "Runs your custom prompt through AI every cycle",
    promptLabel: "Agent instructions",
  },
};

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: agent }, { data: logs }] = await Promise.all([
    supabase.from("agents").select("*").eq("id", id).single(),
    supabase.from("agent_logs").select("*").eq("agent_id", id).order("created_at", { ascending: false }).limit(20),
  ]);

  if (!agent) notFound();

  const typedAgent = agent as Agent;
  const typedLogs = (logs as AgentLog[]) || [];
  const agentInfo = agentTypeInfo[typedAgent.type] || agentTypeInfo.custom;
  const config = (typedAgent.config_json || {}) as Record<string, unknown>;
  const lastRunAt = config.last_run_at ? new Date(config.last_run_at as string).toLocaleString() : "Never";
  // Extract summary-type logs for the email_summarizer panel
  const summaryLogs = typedLogs.filter(
    (l) => l.level === "success" && l.message.startsWith("Summarized:")
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/agents" className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="w-5 h-5 text-zinc-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{typedAgent.name}</h1>
            <Badge variant={
              typedAgent.status === "running" ? "success" :
              typedAgent.status === "error" ? "destructive" : "secondary"
            }>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                typedAgent.status === "running" ? "bg-emerald-400 animate-pulse" :
                typedAgent.status === "error" ? "bg-red-400" : "bg-zinc-500"
              }`} />
              {typedAgent.status}
            </Badge>
          </div>
          <p className="text-zinc-400 mt-1">{agentInfo.what}</p>
        </div>
        <div className="flex items-center gap-3">
          {typedAgent.status === "running" && <RunNowButton agentId={typedAgent.id} />}
          <AgentDetailActions agent={typedAgent} />
        </div>
      </div>

      {/* How it works banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-600/5 border border-blue-500/20">
        <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-300">How this agent works</p>
          <p className="text-xs text-zinc-400 mt-0.5">{agentInfo.how}</p>
          <p className="text-xs text-zinc-500 mt-2">
            Last run: <span className="text-zinc-300">{lastRunAt}</span>
            {typedAgent.status === "running" && " · Runs automatically every minute via cron"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config Info */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="w-4 h-4 text-violet-400" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Type</p>
                <p className="text-sm text-zinc-200">{typedAgent.type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Schedule</p>
                <div className="flex items-center gap-2 text-sm text-zinc-200">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  {typedAgent.schedule}
                </div>
              </div>
              {typedAgent.prompt && (
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{agentInfo.promptLabel}</p>
                  <p className="text-sm text-zinc-300 bg-zinc-800/50 p-3 rounded-lg">{typedAgent.prompt}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Created</p>
                <p className="text-sm text-zinc-400">{new Date(typedAgent.created_at).toLocaleDateString()}</p>
              </div>
              {(typedAgent.type === "email_summarizer" || typedAgent.type === "email_auto_reply") && (
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Email Filter</p>
                  <div className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg w-fit ${
                    config.skip_automated !== false
                      ? "bg-violet-600/10 text-violet-300 border border-violet-500/20"
                      : "bg-zinc-800 text-zinc-400"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${config.skip_automated !== false ? "bg-violet-400" : "bg-zinc-500"}`} />
                    {config.skip_automated !== false ? "Skipping automated emails" : "Processing all emails"}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right panel — Email Summaries (full width) */}
        <div className="lg:col-span-2">
          {typedAgent.type === "email_summarizer" ? (
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  Email Summaries
                </CardTitle>
                <span className="text-xs text-zinc-500 bg-zinc-800 px-2.5 py-1 rounded-full">
                  {summaryLogs.length} processed
                </span>
              </CardHeader>
              <CardContent>
                {summaryLogs.length > 0 ? (
                  <div className="space-y-3">
                    {summaryLogs.map((log: AgentLog) => {
                      const arrow = log.message.indexOf(" → ");
                      const subjectPart = log.message.slice(13, arrow).replace(/^"|"$/g, "");
                      const summaryPart = arrow > 0 ? log.message.slice(arrow + 3).replace(/\.\.\.$/, "") : log.message;
                      return (
                        <div
                          key={log.id}
                          className="group p-4 rounded-xl border border-zinc-800 hover:border-emerald-500/30 bg-zinc-900/50 hover:bg-emerald-600/5 transition-all duration-200"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base">📧</span>
                              <p className="text-sm font-semibold text-zinc-100 truncate">{subjectPart}</p>
                            </div>
                            <p className="text-xs text-zinc-600 shrink-0 mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
                          </div>
                          <p className="text-sm text-zinc-400 leading-relaxed pl-7">{summaryPart}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                      <Mail className="w-7 h-7 text-emerald-400 opacity-60" />
                    </div>
                    <p className="text-zinc-300 font-medium mb-1">No summaries yet</p>
                    <p className="text-sm text-zinc-500 max-w-xs">
                      Start the agent and click <span className="text-violet-400">Run Now</span> to process your inbox.
                      New emails will appear here automatically.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            /* For non-summarizer agents: show a simple status card */
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-violet-400" />
                  Agent Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                    typedAgent.status === "running"
                      ? "bg-emerald-600/10 border border-emerald-500/20"
                      : "bg-zinc-800 border border-zinc-700"
                  }`}>
                    <Bot className={`w-7 h-7 ${typedAgent.status === "running" ? "text-emerald-400" : "text-zinc-500"}`} />
                  </div>
                  <p className="text-zinc-300 font-medium mb-1">
                    {typedAgent.status === "running" ? "Agent is running" : "Agent is stopped"}
                  </p>
                  <p className="text-sm text-zinc-500">
                    Check <a href="/logs" className="text-violet-400 hover:underline">Logs</a> for full activity history.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
