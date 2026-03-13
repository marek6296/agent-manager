"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Mail, Clock, Webhook } from "lucide-react";

const icons: Record<string, typeof Mail> = {
  new_email: Mail,
  schedule: Clock,
  webhook: Webhook,
};

export function TriggerNode({ data, selected }: NodeProps) {
  const nodeType = (data as { nodeType?: string }).nodeType || "new_email";
  const label = (data as { label?: string }).label || "Trigger";
  const Icon = icons[nodeType] || Mail;

  return (
    <div className={`px-4 py-3 rounded-xl border-2 min-w-[160px] transition-all shadow-lg ${
      selected
        ? "border-emerald-400 bg-emerald-950/80 shadow-emerald-500/20"
        : "border-emerald-500/30 bg-zinc-900/90 hover:border-emerald-400/60"
    }`}>
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-emerald-600/20">
          <Icon className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-xs text-emerald-400/70 font-medium uppercase tracking-wider">Trigger</p>
          <p className="text-sm font-semibold text-zinc-100">{label}</p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-emerald-300"
      />
    </div>
  );
}
