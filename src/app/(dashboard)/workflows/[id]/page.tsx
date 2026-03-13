import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { WorkflowBuilderWrapper } from "@/components/workflow-builder/workflow-builder-wrapper";

export default async function WorkflowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: workflow } = await supabase
    .from("workflows")
    .select("*")
    .eq("id", id)
    .single();

  if (!workflow) notFound();

  return (
    <div className="h-[calc(100vh-3rem)] -m-6">
      <WorkflowBuilderWrapper workflow={workflow} />
    </div>
  );
}
