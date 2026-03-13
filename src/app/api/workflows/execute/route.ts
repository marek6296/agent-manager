import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { executeWorkflow } from "@/services/workflows/engine";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workflowId } = await request.json();

    if (!workflowId) {
      return NextResponse.json({ error: "workflowId is required" }, { status: 400 });
    }

    // Fetch workflow
    const { data: workflow } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", workflowId)
      .single();

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    // Execute workflow
    const logs = await executeWorkflow(
      workflow.id,
      user.id,
      workflow.nodes_json,
      workflow.edges_json
    );

    return NextResponse.json({ success: true, logs });
  } catch (err) {
    console.error("Workflow execution error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Execution failed" },
      { status: 500 }
    );
  }
}
