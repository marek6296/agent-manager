"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RunNowButton({ agentId }: { agentId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleRunNow = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/agents/run", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setResult("✅ Agent cycle completed — check logs");
      } else {
        setResult("❌ Error: " + (data.error || "Unknown error"));
      }
    } catch {
      setResult("❌ Failed to trigger run");
    } finally {
      setLoading(false);
      setTimeout(() => setResult(null), 5000);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleRunNow}
        disabled={loading}
        variant="outline"
        size="sm"
        className="border-violet-500/30 text-violet-400 hover:bg-violet-600/10"
      >
        <Zap className="w-3.5 h-3.5 mr-1.5" />
        {loading ? "Running..." : "Run Now"}
      </Button>
      {result && (
        <span className="text-xs text-zinc-400 animate-fade-in">{result}</span>
      )}
    </div>
  );
}
