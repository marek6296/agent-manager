import { NextResponse } from "next/server";
import { runAgentCycle } from "@/workers/agent-runner";

// Agent runner API endpoint - can be called by a cron job or external scheduler
export async function POST(request: Request) {
  try {
    // Optional: verify with a secret key for cron jobs
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await runAgentCycle();

    return NextResponse.json({ success: true, message: "Agent cycle completed" });
  } catch (err) {
    console.error("Agent runner error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Runner failed" },
      { status: 500 }
    );
  }
}
