"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateAgent, setAgentStartPoint } from "@/services/agents/actions";
import type { Agent } from "@/lib/types";
import { Filter, Bot, FileText, MessageSquare, BarChart2, Zap } from "lucide-react";

const capabilities = [
  {
    id: "summarize",
    label: "Summarizer",
    description: "AI summary of each email",
    icon: FileText,
    color: "text-emerald-400",
    activeBg: "border-emerald-500/40 bg-emerald-600/10",
  },
  {
    id: "suggest_reply",
    label: "Reply Suggestions",
    description: "Draft replies for your approval",
    icon: MessageSquare,
    color: "text-blue-400",
    activeBg: "border-blue-500/40 bg-blue-600/10",
  },
  {
    id: "analyze",
    label: "Analyzer",
    description: "Priority, sentiment, action items",
    icon: BarChart2,
    color: "text-amber-400",
    activeBg: "border-amber-500/40 bg-amber-600/10",
  },
  {
    id: "auto_reply",
    label: "Auto Reply",
    description: "Send replies without approval",
    icon: Zap,
    color: "text-red-400",
    activeBg: "border-red-500/40 bg-red-600/10",
  },
];

export function EditAgentDialog({ agent, open, onClose }: { agent: Agent; open: boolean; onClose: () => void }) {
  const config = (agent.config_json || {}) as Record<string, unknown>;

  const initialCaps: string[] = Array.isArray(config.capabilities)
    ? (config.capabilities as string[])
    : agent.type === "email_summarizer" ? ["summarize"]
    : agent.type === "email_auto_reply" ? ["auto_reply"]
    : agent.type === "data_analyzer" ? ["analyze"]
    : ["summarize"];

  const [name, setName] = useState(agent.name);
  const [prompt, setPrompt] = useState(agent.prompt || "");
  const [schedule, setSchedule] = useState(agent.schedule);
  const [selectedCaps, setSelectedCaps] = useState<string[]>(initialCaps);
  const [skipAutomated, setSkipAutomated] = useState<boolean>(config.skip_automated !== false);
  const [loading, setLoading] = useState(false);

  const toggleCap = (id: string) => {
    setSelectedCaps((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateAgent(agent.id, { name, prompt, schedule });
      await setAgentStartPoint(agent.id, (config.last_run_at as string) ?? null, {
        ...config,
        capabilities: selectedCaps,
        skip_automated: skipAutomated,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-violet-400" />
            Edit Agent
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Agent Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Schedule</Label>
            <Select value={schedule} onValueChange={setSchedule}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Every 5 minutes">Every 5 minutes</SelectItem>
                <SelectItem value="Every 15 minutes">Every 15 minutes</SelectItem>
                <SelectItem value="Every hour">Every hour</SelectItem>
                <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                <SelectItem value="Daily">Daily</SelectItem>
                <SelectItem value="Manual">Manual only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Multi-capability selector */}
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
                      active ? cap.activeBg : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
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
            <Label>AI Instructions / Prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Instructions for the AI agent..."
            />
          </div>

          {/* Email filter toggle */}
          {(selectedCaps.includes("summarize") || selectedCaps.includes("suggest_reply") || selectedCaps.includes("auto_reply")) && (
            <div className="rounded-xl border border-zinc-800 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Filter className="w-4 h-4 text-violet-400" />
                Email Filters
              </div>
              <button
                type="button"
                onClick={() => setSkipAutomated(!skipAutomated)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left ${
                  skipAutomated ? "border-violet-500/40 bg-violet-600/10" : "border-zinc-800 bg-zinc-900/50"
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  skipAutomated ? "border-violet-400 bg-violet-400" : "border-zinc-600"
                }`}>
                  {skipAutomated && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">Skip automated & notification emails</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Filters noreply, newsletters, Vercel/GitHub alerts, promotions.
                  </p>
                </div>
              </button>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading || selectedCaps.length === 0} className="bg-violet-600 hover:bg-violet-700">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
