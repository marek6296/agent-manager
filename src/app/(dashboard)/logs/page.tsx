import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Workflow, Activity, Clock, AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";

export default async function LogsPage() {
  const supabase = await createClient();

  const [{ data: agentLogs }, { data: workflowRuns }] = await Promise.all([
    supabase.from("agent_logs").select("*, agents(name)").order("created_at", { ascending: false }).limit(50),
    supabase.from("workflow_runs").select("*, workflows(name)").order("created_at", { ascending: false }).limit(50),
  ]);

  const levelIcons: Record<string, typeof Info> = {
    info: Info,
    warning: AlertTriangle,
    error: XCircle,
    success: CheckCircle,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Logs & Monitoring</h1>
        <p className="text-zinc-400 mt-1">Track agent activity and workflow executions</p>
      </div>

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents" className="gap-2">
            <Bot className="w-4 h-4" /> Agent Logs
          </TabsTrigger>
          <TabsTrigger value="workflows" className="gap-2">
            <Workflow className="w-4 h-4" /> Workflow Runs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-400" />
                Agent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {agentLogs && agentLogs.length > 0 ? (
                <div className="space-y-1">
                  {agentLogs.map((log: {
                    id: string;
                    level: string;
                    message: string;
                    created_at: string;
                    agents?: { name: string };
                  }) => {
                    const LevelIcon = levelIcons[log.level] || Info;
                    return (
                      <div key={log.id} className="flex items-start gap-3 py-3 px-3 rounded-lg hover:bg-zinc-800/30 transition-colors border-b border-zinc-800/30 last:border-0">
                        <LevelIcon className={`w-4 h-4 mt-0.5 shrink-0 ${
                          log.level === "error" ? "text-red-400" :
                          log.level === "warning" ? "text-amber-400" :
                          log.level === "success" ? "text-emerald-400" : "text-blue-400"
                        }`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-zinc-200">{log.message}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {log.agents && (
                              <span className="text-xs text-zinc-500 flex items-center gap-1">
                                <Bot className="w-3 h-3" /> {log.agents.name}
                              </span>
                            )}
                            <span className="text-xs text-zinc-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <Badge variant={
                          log.level === "error" ? "destructive" :
                          log.level === "warning" ? "warning" :
                          log.level === "success" ? "success" : "secondary"
                        } className="shrink-0">
                          {log.level}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 text-zinc-500">
                  <Bot className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">No agent logs yet</p>
                  <p className="text-xs mt-1">Start an agent to see activity here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Workflow className="w-4 h-4 text-amber-400" />
                Workflow Executions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workflowRuns && workflowRuns.length > 0 ? (
                <div className="space-y-1">
                  {workflowRuns.map((run: {
                    id: string;
                    status: string;
                    created_at: string;
                    completed_at?: string;
                    workflows?: { name: string };
                  }) => (
                    <div key={run.id} className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-zinc-800/30 transition-colors border-b border-zinc-800/30 last:border-0">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        run.status === "completed" ? "bg-emerald-400" :
                        run.status === "failed" ? "bg-red-400" :
                        run.status === "running" ? "bg-amber-400 animate-pulse" : "bg-zinc-500"
                      }`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-zinc-200">{run.workflows?.name || "Unknown Workflow"}</p>
                        <span className="text-xs text-zinc-600">
                          {new Date(run.created_at).toLocaleString()}
                          {run.completed_at && ` → ${new Date(run.completed_at).toLocaleString()}`}
                        </span>
                      </div>
                      <Badge variant={
                        run.status === "completed" ? "success" :
                        run.status === "failed" ? "destructive" :
                        run.status === "running" ? "warning" : "secondary"
                      }>
                        {run.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-zinc-500">
                  <Workflow className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">No workflow runs yet</p>
                  <p className="text-xs mt-1">Execute a workflow to see results here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
