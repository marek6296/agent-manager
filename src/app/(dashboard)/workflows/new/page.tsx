"use client";

import { WorkflowBuilder } from "@/components/workflow-builder/workflow-builder";

export default function NewWorkflowPage() {
  return (
    <div className="h-[calc(100vh-3rem)] -m-6">
      <WorkflowBuilder />
    </div>
  );
}
