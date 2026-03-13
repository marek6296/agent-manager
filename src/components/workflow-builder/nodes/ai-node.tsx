"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { FileText, Tag, MessageSquare, Brain } from "lucide-react";

const icons: Record<string, typeof Brain> = {
  summarize: FileText,
  classify: Tag,
  generate_reply: MessageSquare,
  generate_text: Brain,
};

export function AiNode({ data, selected }: NodeProps) {
  const nodeType = (data as { nodeType?: string }).nodeType || "generate_text";
  const label = (data as { label?: string }).label || "AI";
  const Icon = icons[nodeType] || Brain;

  return (
    <div className={`px-4 py-3 rounded-xl border-2 min-w-[160px] transition-all shadow-lg ${
      selected
        ? "border-violet-400 bg-violet-950/80 shadow-violet-500/20"
        : "border-violet-500/30 bg-zinc-900/90 hover:border-violet-400/60"
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-violet-500 !border-2 !border-violet-300"
      />
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-violet-600/20">
          <Icon className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <p className="text-xs text-violet-400/70 font-medium uppercase tracking-wider">AI</p>
          <p className="text-sm font-semibold text-zinc-100">{label}</p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-violet-500 !border-2 !border-violet-300"
      />
    </div>
  );
}
