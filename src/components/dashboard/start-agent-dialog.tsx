"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toggleAgentStatus } from "@/services/agents/actions";
import { setAgentStartPoint } from "@/services/agents/actions";
import { Clock, Calendar, Inbox, History, Play } from "lucide-react";
import type { Agent } from "@/lib/types";

interface StartOption {
  id: string;
  label: string;
  description: string;
  icon: typeof Clock;
  color: string;
}

const startOptions: StartOption[] = [
  {
    id: "from_now",
    label: "From now on",
    description: "Only process new emails received after this moment",
    icon: Clock,
    color: "text-emerald-400",
  },
  {
    id: "all_unread",
    label: "All unread emails",
    description: "Process all currently unread emails in the inbox",
    icon: Inbox,
    color: "text-blue-400",
  },
  {
    id: "last_run",
    label: "Since last run",
    description: "Continue from where the agent last stopped",
    icon: History,
    color: "text-violet-400",
  },
  {
    id: "specific_date",
    label: "From specific date",
    description: "Choose a custom date and time to start from",
    icon: Calendar,
    color: "text-amber-400",
  },
];

export function StartAgentDialog({
  agent,
  open,
  onClose,
}: {
  agent: Agent;
  open: boolean;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState("from_now");
  const [customDate, setCustomDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [loading, setLoading] = useState(false);

  const config = (agent.config_json || {}) as Record<string, unknown>;
  const hasLastRun = !!config.last_run_at;

  // Filter out "since last run" if the agent has never run
  const availableOptions = startOptions.filter(
    (o) => o.id !== "last_run" || hasLastRun
  );

  const handleStart = async () => {
    setLoading(true);
    try {
      let startFrom: string | null = null;

      switch (selected) {
        case "from_now":
          startFrom = new Date().toISOString();
          break;
        case "all_unread":
          startFrom = null; // null = no filter, fetch all unread
          break;
        case "last_run":
          startFrom = config.last_run_at as string;
          break;
        case "specific_date":
          startFrom = new Date(customDate).toISOString();
          break;
      }

      // Set the start point in config_json, then start the agent
      await setAgentStartPoint(agent.id, startFrom, config);
      await toggleAgentStatus(agent.id, "running");
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-400" />
            Start Agent — Choose Start Point
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-zinc-500 -mt-1">
          Select which emails the agent should process when it starts.
        </p>

        <div className="space-y-2 py-1">
          {availableOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelected(option.id)}
              className={`w-full flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                selected === option.id
                  ? "border-violet-500/60 bg-violet-600/10"
                  : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/50"
              }`}
            >
              <div className={`mt-0.5 ${option.color}`}>
                <option.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  selected === option.id ? "text-zinc-100" : "text-zinc-300"
                }`}>
                  {option.label}
                  {option.id === "last_run" && hasLastRun && (
                    <span className="ml-2 text-xs text-zinc-500 font-normal">
                      ({new Date(config.last_run_at as string).toLocaleString()})
                    </span>
                  )}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">{option.description}</p>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 transition-all ${
                selected === option.id
                  ? "border-violet-400 bg-violet-400"
                  : "border-zinc-600"
              }`} />
            </button>
          ))}
        </div>

        {selected === "specific_date" && (
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400">Start date & time</label>
            <Input
              type="datetime-local"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="text-sm"
            />
          </div>
        )}

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Play className="w-3.5 h-3.5 mr-1.5" />
            {loading ? "Starting..." : "Start Agent"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
