"use client";

import { WorkflowBuilder } from "./workflow-builder";
import type { Workflow } from "@/lib/types";
import type { Node, Edge } from "@xyflow/react";

export function WorkflowBuilderWrapper({ workflow }: { workflow: Workflow }) {
  return (
    <WorkflowBuilder
      workflowId={workflow.id}
      initialName={workflow.name}
      initialNodes={(workflow.nodes_json as unknown as Node[]) || []}
      initialEdges={(workflow.edges_json as unknown as Edge[]) || []}
    />
  );
}
