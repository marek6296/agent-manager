import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: integration } = await supabase
    .from("integrations")
    .select("credentials")
    .eq("user_id", user.id)
    .eq("provider", "gmail")
    .single();

  if (!integration) return NextResponse.json({ emails: [] });

  const creds = integration.credentials as Record<string, string>;
  const accessToken = creds.access_token;

  try {
    // Fetch recent inbox messages (all, not just unread)
    const listRes = await fetch(
      `${GMAIL_API_BASE}/users/me/messages?maxResults=30&labelIds=INBOX`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const listData = await listRes.json();
    if (!listData.messages) return NextResponse.json({ emails: [] });

    const emails = await Promise.all(
      listData.messages.slice(0, 25).map(async (msg: { id: string }) => {
        const res = await fetch(
          `${GMAIL_API_BASE}/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject,From,Date`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const data = await res.json();
        const headers: { name: string; value: string }[] = data.payload?.headers || [];
        const get = (name: string) => headers.find(h => h.name === name)?.value || "";
        return {
          id: data.id,
          subject: get("Subject") || "(no subject)",
          from: get("From"),
          date: get("Date"),
          snippet: data.snippet || "",
          isUnread: (data.labelIds || []).includes("UNREAD"),
        };
      })
    );

    return NextResponse.json({ emails });
  } catch (err) {
    return NextResponse.json({ error: String(err), emails: [] }, { status: 500 });
  }
}
