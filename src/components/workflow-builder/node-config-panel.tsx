"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Settings } from "lucide-react";
import type { Node } from "@xyflow/react";
import { useState, useEffect } from "react";

interface NodeConfigPanelProps {
  node: Node;
  onUpdateConfig: (config: Record<string, unknown>) => void;
  onClose: () => void;
}

const configFields: Record<string, { label: string; type: "text" | "textarea" | "select"; placeholder: string; options?: string[] }[]> = {
  new_email: [
    { label: "Filter (From)", type: "text", placeholder: "Filter by sender email..." },
    { label: "Filter (Subject)", type: "text", placeholder: "Filter by subject..." },
    { label: "Max Messages", type: "text", placeholder: "10" },
  ],
  schedule: [
    { label: "Cron Expression", type: "text", placeholder: "*/5 * * * *" },
    { label: "Timezone", type: "text", placeholder: "UTC" },
  ],
  webhook: [
    { label: "Webhook URL", type: "text", placeholder: "Generated on save..." },
    { label: "Secret", type: "text", placeholder: "Webhook secret for verification" },
  ],
  send_email: [
    { label: "To", type: "text", placeholder: "recipient@example.com" },
    { label: "Subject", type: "text", placeholder: "Email subject..." },
    { label: "Body Template", type: "textarea", placeholder: "Use {{input}} for previous node data..." },
  ],
  store_data: [
    { label: "Table Name", type: "text", placeholder: "custom_data" },
    { label: "Data Mapping", type: "textarea", placeholder: "JSON mapping configuration..." },
  ],
  notification: [
    { label: "Channel", type: "text", placeholder: "email, slack, webhook..." },
    { label: "Message Template", type: "textarea", placeholder: "Use {{input}} for data..." },
  ],
  summarize: [
    { label: "System Prompt", type: "textarea", placeholder: "Custom instructions for summarization..." },
    { label: "Max Tokens", type: "text", placeholder: "500" },
  ],
  classify: [
    { label: "Categories", type: "textarea", placeholder: "urgent, normal, spam (comma separated)" },
    { label: "System Prompt", type: "textarea", placeholder: "Custom classification instructions..." },
  ],
  generate_reply: [
    { label: "Tone", type: "text", placeholder: "professional, friendly, formal..." },
    { label: "Instructions", type: "textarea", placeholder: "Instructions for generating the reply..." },
  ],
  generate_text: [
    { label: "Prompt Template", type: "textarea", placeholder: "Generate text using {{input}} as context..." },
    { label: "Model", type: "text", placeholder: "gpt-4o-mini" },
    { label: "Temperature", type: "text", placeholder: "0.7" },
  ],
};

export function NodeConfigPanel({ node, onUpdateConfig, onClose }: NodeConfigPanelProps) {
  const nodeType = (node.data as { nodeType?: string }).nodeType || "";
  const label = (node.data as { label?: string }).label || "";
  const currentConfig = ((node.data as { config?: Record<string, unknown> }).config || {}) as Record<string, string>;
  const fields = configFields[nodeType] || [];

  const [values, setValues] = useState<Record<string, string>>(currentConfig);

  useEffect(() => {
    setValues(((node.data as { config?: Record<string, unknown> }).config as Record<string, string>) || {});
  }, [node.id, node.data]);

  const handleChange = (key: string, value: string) => {
    const newValues = { ...values, [key]: value };
    setValues(newValues);
    onUpdateConfig(newValues);
  };

  return (
    <div className="w-72 bg-zinc-950 border-l border-zinc-800 overflow-y-auto p-4 space-y-4 animate-slide-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-zinc-200">Configure Node</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 text-zinc-500" />
        </button>
      </div>

      <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
        <p className="text-xs text-zinc-500 uppercase tracking-wider">Node Type</p>
        <p className="text-sm font-medium text-zinc-200 mt-0.5">{label}</p>
      </div>

      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field.label} className="space-y-1.5">
            <Label className="text-xs">{field.label}</Label>
            {field.type === "textarea" ? (
              <Textarea
                value={values[field.label] || ""}
                onChange={(e) => handleChange(field.label, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                className="text-xs"
              />
            ) : (
              <Input
                value={values[field.label] || ""}
                onChange={(e) => handleChange(field.label, e.target.value)}
                placeholder={field.placeholder}
                className="text-xs h-8"
              />
            )}
          </div>
        ))}
      </div>

      {fields.length === 0 && (
        <p className="text-xs text-zinc-500 text-center py-4">No configuration options for this node type.</p>
      )}
    </div>
  );
}
