import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Workflow, Plus } from "lucide-react";
import Link from "next/link";
import { WorkflowActions } from "@/components/dashboard/workflow-actions";
import type { Workflow as WorkflowType } from "@/lib/types";

export default async function WorkflowsPage() {
  const supabase = await createClient();
  const { data: workflows } = await supabase
    .from("workflows")
    .select("*")
    .order("created_at", { ascending: false });

  const typedWorkflows = (workflows as WorkflowType[]) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Workflows</h1>
          <p className="text-zinc-400 mt-1">Build visual automation flows with drag-and-drop</p>
        </div>
        <Link href="/workflows/new">
          <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">
            <Plus className="w-4 h-4" />
            New Workflow
          </button>
        </Link>
      </div>

      {typedWorkflows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {typedWorkflows.map((workflow) => (
            <Link key={workflow.id} href={`/workflows/${workflow.id}`}>
              <Card className="hover:border-zinc-700 transition-all duration-300 cursor-pointer group h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 rounded-lg bg-amber-600/10">
                      <Workflow className="w-5 h-5 text-amber-400" />
                    </div>
                    <Badge variant={workflow.active ? "success" : "secondary"}>
                      {workflow.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-zinc-100 mb-1 group-hover:text-white">{workflow.name}</h3>
                  {workflow.description && (
                    <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{workflow.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span>{(workflow.nodes_json as unknown[])?.length || 0} nodes</span>
                    <span>•</span>
                    <span>{(workflow.edges_json as unknown[])?.length || 0} connections</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-zinc-800/50">
                    <WorkflowActions workflow={workflow} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
            <Workflow className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-300 mb-2">No workflows yet</h3>
          <p className="text-sm text-zinc-500 max-w-sm mb-4">
            Create your first automation workflow with our visual drag-and-drop builder.
          </p>
          <Link href="/workflows/new">
            <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">
              <Plus className="w-4 h-4" />
              Create Workflow
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
