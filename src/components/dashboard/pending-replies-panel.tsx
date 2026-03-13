"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, X, Pencil, Check, ChevronDown, ChevronUp } from "lucide-react";
import type { AgentLog } from "@/lib/types";

interface PendingReply {
  to: string;
  subject: string;
  original_subject: string;
  reply: string;
}

export function PendingRepliesPanel({ logs }: { logs: AgentLog[] }) {
  const pendingLogs = logs.filter((l) => l.level === "pending_reply");

  if (pendingLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-4">
          <Send className="w-6 h-6 text-blue-400 opacity-60" />
        </div>
        <p className="text-zinc-300 font-medium mb-1">No pending replies</p>
        <p className="text-sm text-zinc-500">When the agent drafts replies, they'll appear here for your approval.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pendingLogs.map((log) => (
        <PendingReplyCard key={log.id} log={log} />
      ))}
    </div>
  );
}

function PendingReplyCard({ log }: { log: AgentLog }) {
  const pending: PendingReply = JSON.parse(log.message);
  const [editing, setEditing] = useState(false);
  const [editedReply, setEditedReply] = useState(pending.reply);
  const [expanded, setExpanded] = useState(true);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "rejected">("idle");

  const handleApprove = async () => {
    setStatus("sending");
    try {
      const res = await fetch("/api/agents/approve-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log_id: log.id, action: "approve", edited_reply: editedReply }),
      });
      const data = await res.json();
      if (data.success) setStatus("sent");
      else { setStatus("idle"); alert("Error: " + data.error); }
    } catch { setStatus("idle"); }
  };

  const handleReject = async () => {
    setStatus("sending");
    try {
      await fetch("/api/agents/approve-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log_id: log.id, action: "reject" }),
      });
      setStatus("rejected");
    } catch { setStatus("idle"); }
  };

  if (status === "sent") {
    return (
      <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-600/5 flex items-center gap-3">
        <Check className="w-4 h-4 text-emerald-400" />
        <div>
          <p className="text-sm text-zinc-300 font-medium">Sent: <span className="text-zinc-400 font-normal">{pending.original_subject}</span></p>
          <p className="text-xs text-zinc-500">Reply was sent to {pending.to}</p>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="p-4 rounded-xl border border-zinc-700 bg-zinc-900/30 flex items-center gap-3 opacity-60">
        <X className="w-4 h-4 text-zinc-500" />
        <p className="text-sm text-zinc-500">Rejected: {pending.original_subject}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-600/5 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-start justify-between gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30 text-[10px]">Draft</Badge>
            <p className="text-sm font-semibold text-zinc-100 truncate">{pending.original_subject}</p>
          </div>
          <p className="text-xs text-zinc-500">To: {pending.to} · {new Date(log.created_at).toLocaleString()}</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />}
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {editing ? (
            <Textarea
              value={editedReply}
              onChange={(e) => setEditedReply(e.target.value)}
              rows={6}
              className="text-sm bg-zinc-900 border-zinc-700 text-zinc-200"
            />
          ) : (
            <div className="bg-zinc-900/80 rounded-lg p-3 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed border border-zinc-800">
              {editedReply}
            </div>
          )}

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(!editing)}
              className="text-zinc-400 hover:text-zinc-200 text-xs"
            >
              <Pencil className="w-3.5 h-3.5 mr-1" />
              {editing ? "Preview" : "Edit"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReject}
              disabled={status === "sending"}
              className="text-red-400 hover:text-red-300 text-xs"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Reject
            </Button>
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={status === "sending"}
              className="bg-blue-600 hover:bg-blue-700 text-xs"
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              {status === "sending" ? "Sending..." : "Approve & Send"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
