"use client";

import { useState } from "react";
import { createAgentMulti } from "@/services/agents/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Plus, FileText, MessageSquare, BarChart2, Zap } from "lucide-react";
import type { Integration } from "@/lib/types";

const capabilities = [
  {
    id: "summarize",
    label: "Email Summarizer",
    description: "Creates AI summary of each email and logs it",
    icon: FileText,
    color: "text-emerald-400",
    bg: "bg-emerald-600/10 border-emerald-500/30",
  },
  {
    id: "suggest_reply",
    label: "Reply Suggestions",
    description: "Drafts reply for your approval before sending",
    icon: MessageSquare,
    color: "text-blue-400",
    bg: "bg-blue-600/10 border-blue-500/30",
  },
  {
    id: "analyze",
    label: "Email Analyzer",
    description: "Analyzes priority, sentiment, and action items",
    icon: BarChart2,
    color: "text-amber-400",
    bg: "bg-amber-600/10 border-amber-500/30",
  },
  {
    id: "auto_reply",
    label: "Auto Reply",
    description: "Automatically sends AI replies without approval",
    icon: Zap,
    color: "text-red-400",
    bg: "bg-red-600/10 border-red-500/30",
  },
];

const scheduleOptions = [
  { value: "*/1 * * * *", label: "Every minute" },
  { value: "*/5 * * * *", label: "Every 5 minutes" },
  { value: "*/15 * * * *", label: "Every 15 minutes" },
  { value: "*/30 * * * *", label: "Every 30 minutes" },
  { value: "0 * * * *", label: "Every hour" },
  { value: "0 */6 * * *", label: "Every 6 hours" },
  { value: "0 0 * * *", label: "Daily" },
];

export function CreateAgentDialog({ integrations }: { integrations: Integration[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [schedule, setSchedule] = useState("*/5 * * * *");
  const [integrationId, setIntegrationId] = useState("");
  const [selectedCaps, setSelectedCaps] = useState<string[]>(["summarize"]);

  const toggleCap = (id: string) => {
    setSelectedCaps((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!name || selectedCaps.length === 0) return;
    setLoading(true);
    try {
      await createAgentMulti({
        name,
        prompt,
        schedule,
        integration_id: integrationId || null,
        capabilities: selectedCaps,
      });
      setOpen(false);
      setName(""); setPrompt(""); setSelectedCaps(["summarize"]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Agent
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
          <DialogDescription>Select one or more capabilities for your AI agent.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Agent Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Email Assistant" />
          </div>

          {/* Capabilities multi-select */}
          <div className="space-y-1.5">
            <Label>Capabilities <span className="text-zinc-500 font-normal">(select one or more)</span></Label>
            <div className="grid grid-cols-2 gap-2">
              {capabilities.map((cap) => {
                const active = selectedCaps.includes(cap.id);
                return (
                  <button
                    key={cap.id}
                    type="button"
                    onClick={() => toggleCap(cap.id)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      active ? cap.bg : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                    }`}
                  >
                    <cap.icon className={`w-4 h-4 mt-0.5 shrink-0 ${active ? cap.color : "text-zinc-500"}`} />
                    <div>
                      <p className={`text-xs font-semibold ${active ? "text-zinc-100" : "text-zinc-400"}`}>
                        {cap.label}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5 leading-tight">{cap.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>AI Instructions</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Be concise and professional. Highlight action items. Reply in Slovak language."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Schedule</Label>
              <select
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                {scheduleOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {integrations.length > 0 && (
              <div className="space-y-1.5">
                <Label>Integration</Label>
                <select
                  value={integrationId}
                  onChange={(e) => setIntegrationId(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  <option value="">None</option>
                  {integrations.map((i) => (
                    <option key={i.id} value={i.id}>{i.provider} ({i.connected ? "✓" : "✗"})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              className="bg-violet-600 hover:bg-violet-700"
              disabled={loading || !name || selectedCaps.length === 0}
            >
              {loading ? "Creating..." : "Create Agent"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
