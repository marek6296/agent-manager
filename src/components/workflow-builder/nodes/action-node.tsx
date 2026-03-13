"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Send, Database, Bell } from "lucide-react";

const icons: Record<string, typeof Send> = {
  send_email: Send,
  store_data: Database,
  notification: Bell,
};

export function ActionNode({ data, selected }: NodeProps) {
  const nodeType = (data as { nodeType?: string }).nodeType || "send_email";
  const label = (data as { label?: string }).label || "Action";
  const Icon = icons[nodeType] || Send;

  return (
    <div className={`px-4 py-3 rounded-xl border-2 min-w-[160px] transition-all shadow-lg ${
      selected
        ? "border-blue-400 bg-blue-950/80 shadow-blue-500/20"
        : "border-blue-500/30 bg-zinc-900/90 hover:border-blue-400/60"
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-blue-300"
      />
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-blue-600/20">
          <Icon className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <p className="text-xs text-blue-400/70 font-medium uppercase tracking-wider">Action</p>
          <p className="text-sm font-semibold text-zinc-100">{label}</p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-blue-300"
      />
    </div>
  );
}
