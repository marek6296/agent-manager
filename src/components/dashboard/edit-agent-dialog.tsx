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
import { Filter, Bot } from "lucide-react";

export function EditAgentDialog({ agent, open, onClose }: { agent: Agent; open: boolean; onClose: () => void }) {
  const config = (agent.config_json || {}) as Record<string, unknown>;

  const [name, setName] = useState(agent.name);
  const [prompt, setPrompt] = useState(agent.prompt || "");
  const [schedule, setSchedule] = useState(agent.schedule);
  const [skipAutomated, setSkipAutomated] = useState<boolean>(
    config.skip_automated !== false // default ON (true)
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save name, prompt, schedule
      await updateAgent(agent.id, { name, prompt, schedule });
      // Save skip_automated into config_json
      await setAgentStartPoint(agent.id, (config.last_run_at as string) ?? null, {
        ...config,
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
      <DialogContent className="sm:max-w-lg">
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

          <div className="space-y-1.5">
            <Label>AI Instructions / Prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Instructions for the AI agent..."
            />
          </div>

          {/* Email filter toggle — only relevant for email agents */}
          {(agent.type === "email_summarizer" || agent.type === "email_auto_reply") && (
            <div className="rounded-xl border border-zinc-800 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Filter className="w-4 h-4 text-violet-400" />
                Email Filters
              </div>

              <button
                type="button"
                onClick={() => setSkipAutomated(!skipAutomated)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left ${
                  skipAutomated
                    ? "border-violet-500/40 bg-violet-600/10"
                    : "border-zinc-800 bg-zinc-900/50"
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
                    Filters out noreply, newsletters, system notifications, Vercel, GitHub alerts, etc.
                    Only processes emails from real people and companies.
                  </p>
                </div>
              </button>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="bg-violet-600 hover:bg-violet-700">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
