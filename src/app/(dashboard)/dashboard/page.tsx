import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Plug, Workflow, Activity, Clock, Zap, ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: totalAgents },
    { count: runningAgents },
    { count: connectedIntegrations },
    { count: totalWorkflows },
    { count: activeWorkflows },
    { data: recentRuns },
    { data: recentLogs },
  ] = await Promise.all([
    supabase.from("agents").select("*", { count: "exact", head: true }),
    supabase.from("agents").select("*", { count: "exact", head: true }).eq("status", "running"),
    supabase.from("integrations").select("*", { count: "exact", head: true }).eq("connected", true),
    supabase.from("workflows").select("*", { count: "exact", head: true }),
    supabase.from("workflows").select("*", { count: "exact", head: true }).eq("active", true),
    supabase.from("workflow_runs").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("agent_logs").select("*, agents(name)").order("created_at", { ascending: false }).limit(8),
  ]);

  const metrics = [
    {
      title: "Active Agents",
      value: runningAgents || 0,
      total: totalAgents || 0,
      icon: Bot,
      color: "text-violet-400",
      bgColor: "bg-violet-600/10",
      borderColor: "border-violet-500/20",
      href: "/agents",
    },
    {
      title: "Integrations",
      value: connectedIntegrations || 0,
      icon: Plug,
      color: "text-emerald-400",
      bgColor: "bg-emerald-600/10",
      borderColor: "border-emerald-500/20",
      href: "/integrations",
    },
    {
      title: "Active Workflows",
      value: activeWorkflows || 0,
      total: totalWorkflows || 0,
      icon: Workflow,
      color: "text-amber-400",
      bgColor: "bg-amber-600/10",
      borderColor: "border-amber-500/20",
      href: "/workflows",
    },
    {
      title: "Total Executions",
      value: recentRuns?.length || 0,
      icon: Activity,
      color: "text-blue-400",
      bgColor: "bg-blue-600/10",
      borderColor: "border-blue-500/20",
      href: "/logs",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-400 mt-1">Welcome to your AI automation control center</p>
        </div>
        <div className="flex gap-3">
          <Link href="/agents">
            <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">
              <Bot className="w-4 h-4" />
              New Agent
            </button>
          </Link>
          <Link href="/workflows">
            <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium transition-colors border border-zinc-700 cursor-pointer">
              <Workflow className="w-4 h-4" />
              New Workflow
            </button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Link key={metric.title} href={metric.href}>
            <Card className={`hover:border-zinc-700 transition-all duration-300 hover:shadow-lg group cursor-pointer ${metric.bgColor} border ${metric.borderColor}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-lg ${metric.bgColor}`}>
                    <metric.icon className={`w-5 h-5 ${metric.color}`} />
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-white">{metric.value}</p>
                  <p className="text-sm text-zinc-400">
                    {metric.title}
                    {metric.total !== undefined && (
                      <span className="text-zinc-600"> / {metric.total} total</span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Workflow Runs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="w-4 h-4 text-amber-400" />
              Recent Executions
            </CardTitle>
            <Link href="/logs" className="text-sm text-violet-400 hover:text-violet-300">
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRuns && recentRuns.length > 0 ? (
                recentRuns.map((run: { id: string; status: string; created_at: string }) => (
                  <div key={run.id} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        run.status === "completed" ? "bg-emerald-400" :
                        run.status === "failed" ? "bg-red-400" :
                        run.status === "running" ? "bg-amber-400 animate-pulse" :
                        "bg-zinc-500"
                      }`} />
                      <span className="text-sm text-zinc-300">Workflow Run</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        run.status === "completed" ? "success" :
                        run.status === "failed" ? "destructive" :
                        run.status === "running" ? "warning" : "secondary"
                      }>
                        {run.status}
                      </Badge>
                      <span className="text-xs text-zinc-500">
                        {new Date(run.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-500">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No executions yet</p>
                  <p className="text-xs mt-1">Create a workflow to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Agent Logs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ScrollText className="w-4 h-4 text-emerald-400" />
              Agent Activity
            </CardTitle>
            <Link href="/logs" className="text-sm text-violet-400 hover:text-violet-300">
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLogs && recentLogs.length > 0 ? (
                recentLogs.map((log: { id: string; level: string; message: string; created_at: string; agents?: { name: string } }) => (
                  <div key={log.id} className="flex items-start gap-3 py-2 border-b border-zinc-800/50 last:border-0">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      log.level === "error" ? "bg-red-400" :
                      log.level === "warning" ? "bg-amber-400" :
                      log.level === "success" ? "bg-emerald-400" :
                      "bg-blue-400"
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-300 truncate">{log.message}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {log.agents && <span className="text-xs text-zinc-500">{log.agents.name}</span>}
                        <span className="text-xs text-zinc-600">{new Date(log.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-500">
                  <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No agent activity yet</p>
                  <p className="text-xs mt-1">Create an agent to see logs here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Guide */}
      <Card className="bg-gradient-to-r from-violet-600/5 to-emerald-600/5 border-zinc-800/50">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-400" />
            Quick Start Guide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: "1", title: "Connect Gmail", desc: "Link your Gmail account to enable email automations", href: "/integrations", icon: Plug },
              { step: "2", title: "Create an Agent", desc: "Set up an AI agent to process emails automatically", href: "/agents", icon: Bot },
              { step: "3", title: "Build a Workflow", desc: "Create a visual automation flow with triggers and actions", href: "/workflows", icon: Workflow },
            ].map((item) => (
              <Link key={item.step} href={item.href}>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 border border-zinc-800/50 transition-all group cursor-pointer">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600/20 text-violet-400 text-sm font-bold shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-medium text-zinc-200 group-hover:text-white">{item.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ScrollText(props: React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/>
      <path d="M19 17V5a2 2 0 0 0-2-2H4"/>
      <path d="M15 8h-5"/><path d="M15 12h-5"/>
    </svg>
  );
}
