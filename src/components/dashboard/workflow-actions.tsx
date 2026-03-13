"use client";

import { toggleWorkflowActive, deleteWorkflow } from "@/services/workflows/actions";
import { Power, Trash2 } from "lucide-react";
import type { Workflow } from "@/lib/types";

export function WorkflowActions({ workflow }: { workflow: Workflow }) {
  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWorkflowActive(workflow.id, !workflow.active);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Delete this workflow?")) {
      await deleteWorkflow(workflow.id);
    }
  };

  return (
    <div className="flex items-center gap-2" onClick={e => e.preventDefault()}>
      <button
        onClick={handleToggle}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
          workflow.active
            ? "text-amber-400 hover:bg-amber-600/10"
            : "text-emerald-400 hover:bg-emerald-600/10"
        }`}
      >
        <Power className="w-3 h-3" />
        {workflow.active ? "Deactivate" : "Activate"}
      </button>
      <button
        onClick={handleDelete}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-red-400 hover:bg-red-600/10 transition-colors cursor-pointer"
      >
        <Trash2 className="w-3 h-3" />
        Delete
      </button>
    </div>
  );
}
