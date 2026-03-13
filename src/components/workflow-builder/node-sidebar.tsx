"use client";

import { Mail, Clock, Webhook, Send, Brain, Database, Bell, FileText, Tag, MessageSquare } from "lucide-react";

const nodeCategories = [
  {
    name: "Triggers",
    color: "text-emerald-400",
    bgColor: "bg-emerald-600/10",
    borderColor: "border-emerald-500/30",
    nodes: [
      { type: "new_email", label: "New Email", icon: Mail, category: "trigger" },
      { type: "schedule", label: "Schedule", icon: Clock, category: "trigger" },
      { type: "webhook", label: "Webhook", icon: Webhook, category: "trigger" },
    ],
  },
  {
    name: "Actions",
    color: "text-blue-400",
    bgColor: "bg-blue-600/10",
    borderColor: "border-blue-500/30",
    nodes: [
      { type: "send_email", label: "Send Email", icon: Send, category: "action" },
      { type: "store_data", label: "Store Data", icon: Database, category: "action" },
      { type: "notification", label: "Notification", icon: Bell, category: "action" },
    ],
  },
  {
    name: "AI",
    color: "text-violet-400",
    bgColor: "bg-violet-600/10",
    borderColor: "border-violet-500/30",
    nodes: [
      { type: "summarize", label: "Summarize", icon: FileText, category: "ai" },
      { type: "classify", label: "Classify", icon: Tag, category: "ai" },
      { type: "generate_reply", label: "Generate Reply", icon: MessageSquare, category: "ai" },
      { type: "generate_text", label: "Generate Text", icon: Brain, category: "ai" },
    ],
  },
];

export function NodeSidebar() {
  const onDragStart = (event: React.DragEvent, type: string, label: string, category: string) => {
    event.dataTransfer.setData("application/reactflow-type", type);
    event.dataTransfer.setData("application/reactflow-label", label);
    event.dataTransfer.setData("application/reactflow-category", category);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="w-56 bg-zinc-950 border-r border-zinc-800 overflow-y-auto p-3 space-y-4">
      <div className="px-2">
        <h3 className="text-sm font-semibold text-zinc-300 mb-1">Node Library</h3>
        <p className="text-xs text-zinc-500">Drag nodes onto the canvas</p>
      </div>

      {nodeCategories.map((category) => (
        <div key={category.name} className="space-y-1.5">
          <h4 className={`text-xs font-semibold uppercase tracking-wider px-2 ${category.color}`}>
            {category.name}
          </h4>
          {category.nodes.map((node) => (
            <div
              key={node.type}
              draggable
              onDragStart={(e) => onDragStart(e, node.type, node.label, node.category)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${category.bgColor} border ${category.borderColor} cursor-grab hover:brightness-125 transition-all text-sm active:cursor-grabbing`}
            >
              <node.icon className={`w-4 h-4 ${category.color} shrink-0`} />
              <span className="text-zinc-300 text-xs font-medium">{node.label}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
