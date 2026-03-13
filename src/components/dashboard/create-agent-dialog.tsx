"use client";

import { useState } from "react";
import { createAgent } from "@/services/agents/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import type { Integration } from "@/lib/types";

const agentTypes = [
  { value: "email_summarizer", label: "Email Summarizer" },
  { value: "email_auto_reply", label: "Email Auto Reply" },
  { value: "data_analyzer", label: "Data Analyzer" },
  { value: "custom", label: "Custom Agent" },
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

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      await createAgent(formData);
      setOpen(false);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
          <DialogDescription>Configure your AI agent with a name, type, and instructions.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name</Label>
            <Input id="name" name="name" placeholder="My Email Agent" required />
          </div>

          <div className="space-y-2">
            <Label>Agent Type</Label>
            <select name="type" className="flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" defaultValue="email_summarizer">
              {agentTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">AI Instructions</Label>
            <Textarea
              id="prompt"
              name="prompt"
              placeholder="Summarize each email and highlight action items..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Schedule</Label>
            <select name="schedule" className="flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" defaultValue="*/5 * * * *">
              {scheduleOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {integrations.length > 0 && (
            <div className="space-y-2">
              <Label>Integration</Label>
              <select name="integration_id" className="flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
                <option value="">None</option>
                {integrations.map((i) => (
                  <option key={i.id} value={i.id}>{i.provider} ({i.connected ? "Connected" : "Disconnected"})</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={loading}>
              {loading ? "Creating..." : "Create Agent"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
