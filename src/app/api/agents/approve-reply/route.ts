import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/integrations/gmail";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
  try {
    const supabaseUser = await createServerClient();
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { log_id, action, edited_reply } = await request.json();
    // action: "approve" | "reject"

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the pending_reply log entry
    const { data: log } = await supabase
      .from("agent_logs")
      .select("*, agents!inner(user_id, integration_id)")
      .eq("id", log_id)
      .eq("level", "pending_reply")
      .single();

    if (!log) return NextResponse.json({ error: "Log not found" }, { status: 404 });
    if ((log.agents as Record<string, unknown>).user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (action === "reject") {
      // Mark as rejected
      await supabase.from("agent_logs").update({ level: "rejected" }).eq("id", log_id);
      return NextResponse.json({ success: true, action: "rejected" });
    }

    if (action === "approve") {
      const pending = JSON.parse(log.message);
      const replyText = edited_reply || pending.reply;

      // Get Gmail tokens
      const { data: integration } = await supabase
        .from("integrations")
        .select("credentials")
        .eq("user_id", user.id)
        .eq("provider", "gmail")
        .single();

      if (!integration) return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });
      const creds = integration.credentials as Record<string, string>;
      const accessToken = creds.access_token;

      await sendEmail(accessToken, pending.to, pending.subject, replyText);

      // Mark as sent
      await supabase.from("agent_logs").update({
        level: "sent",
        message: JSON.stringify({ ...pending, reply: replyText, sent_at: new Date().toISOString() }),
      }).eq("id", log_id);

      return NextResponse.json({ success: true, action: "sent" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Approve reply error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
