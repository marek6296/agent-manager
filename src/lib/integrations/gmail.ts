// Gmail Integration Module
// Handles OAuth flow and Gmail API operations

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  labels: string[];
}

interface GmailTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
];

export function getGmailAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: process.env.GOOGLE_REDIRECT_URI || "",
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<GmailTokens> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || "",
      grant_type: "authorization_code",
    }),
  });

  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry_date: Date.now() + data.expires_in * 1000,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<GmailTokens> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: refreshToken,
    expiry_date: Date.now() + data.expires_in * 1000,
  };
}

export async function getInboxMessages(
  accessToken: string,
  maxResults: number = 10,
  afterDate?: Date,
  skipAutomated: boolean = true
): Promise<GmailMessage[]> {
  // Dedup is via after:TIMESTAMP only — NOT is:unread
  // This way emails stay processable after markAsRead or log clearing
  const effectiveAfter = afterDate ?? new Date(Date.now() - 48 * 60 * 60 * 1000); // default: last 48h
  let q = `in:inbox after:${Math.floor(effectiveAfter.getTime() / 1000)}`;
  if (skipAutomated) {
    q += [
      // THE most powerful filter — Gmail auto-tags bulk emails with unsubscribe links
      " -has:unsubscribe",
      // Gmail smart labels
      " -label:^smartlabel_newsletter",
      " -label:^smartlabel_notification",
      " -label:^smartlabel_promo",
      // Gmail categories
      " -category:promotions",
      " -category:updates",
      // Known automated from patterns
      " -from:noreply",
      " -from:no-reply",
      " -from:donotreply",
      " -from:do-not-reply",
      " -from:mailer",
      " -from:notification",
      " -from:newsletter",
      " -from:alerts",
      " -from:autoconfirm",
      " -from:automated",
      " -from:bounce",
      " -from:info@vercel",
      " -from:support@vercel",
      " -from:github",
      " -from:supabase",
    ].join("");
  }

  const listResponse = await fetch(
    `${GMAIL_API_BASE}/users/me/messages?maxResults=${maxResults * 2}&labelIds=INBOX&q=${encodeURIComponent(q)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!listResponse.ok) {
    const err = await listResponse.text();
    throw new Error(`Gmail API error: ${err}`);
  }

  const listData = await listResponse.json();
  if (!listData.messages || listData.messages.length === 0) return [];

  const messages = await Promise.all(
    listData.messages.map(async (msg: { id: string }) => {
      const msgResponse = await fetch(
        `${GMAIL_API_BASE}/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const msgData = await msgResponse.json();
      return parseGmailMessage(msgData);
    })
  );

  // Second layer: JS-level filter on actual email content
  const filtered = skipAutomated
    ? messages.filter((msg) => isHumanEmail(msg))
    : messages;

  return filtered.slice(0, maxResults);
}

/**
 * Heuristic check: is this likely a real human-written email?
 * Returns false for bulk/automated emails that slipped through Gmail filters.
 */
function isHumanEmail(msg: GmailMessage): boolean {
  const from = (msg.from || "").toLowerCase();
  const subject = (msg.subject || "").toLowerCase();
  const body = (msg.body || "").toLowerCase();

  // Reject if body contains classic bulk-email markers
  const bodyMarkers = [
    "unsubscribe",
    "opt out",
    "email preferences",
    "you are receiving this",
    "you received this email because",
    "this is an automated",
    "automated message",
    "do not reply to this email",
    "do not reply to this message",
    "privacy policy",
    "terms of service",
    "terms & conditions",
    "view in browser",
    "view this email in your browser",
    "click here to unsubscribe",
  ];
  if (bodyMarkers.some((marker) => body.includes(marker))) return false;

  // Reject if from address looks automated
  const fromMarkers = [
    "noreply", "no-reply", "donotreply", "do-not-reply",
    "mailer", "notification", "newsletter", "alerts",
    "automated", "bounce", "system@", "robot@",
    "support@apple", "news@", "info@", "updates@",
    "promotions@", "marketing@", "hello@temu", "info@trading",
  ];
  if (fromMarkers.some((m) => from.includes(m))) return false;

  // Reject based on subject patterns
  const subjectMarkers = [
    "unsubscribe", "newsletter", "promotion", "offer", "discount",
    "% off", "sale ends", "claim your", "you've been selected",
    "verify your email", "confirm your email",
    "deployment notification", "failed deployment", "build failed",
    "your account", "terms of service have", "privacy policy update",
    "new project launched", "invoice #",
  ];
  if (subjectMarkers.some((m) => subject.includes(m))) return false;

  return true;
}


function parseGmailMessage(msgData: Record<string, unknown>): GmailMessage {
  const payload = msgData.payload as Record<string, unknown> | undefined;
  const headers: { name: string; value: string }[] = (payload?.headers as { name: string; value: string }[]) || [];
  const getHeader = (name: string) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

  let body = "";
  const payloadBody = payload?.body as { data?: string } | undefined;
  if (payloadBody?.data) {
    body = Buffer.from(payloadBody.data, "base64").toString("utf-8");
  } else if (payload?.parts) {
    const parts = payload.parts as { mimeType: string; body?: { data?: string } }[];
    const textPart = parts.find((p) => p.mimeType === "text/plain");
    if (textPart?.body?.data) {
      body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
    }
  }

  return {
    id: msgData.id as string,
    threadId: msgData.threadId as string,
    snippet: msgData.snippet as string,
    subject: getHeader("Subject"),
    from: getHeader("From"),
    to: getHeader("To"),
    date: getHeader("Date"),
    body,
    labels: (msgData.labelIds as string[]) || [],
  };
}

/**
 * Mark a Gmail message as read (removes UNREAD label).
 * Called after processing an email to prevent re-processing on next cycle.
 */
export async function markAsRead(accessToken: string, messageId: string): Promise<void> {
  await fetch(`${GMAIL_API_BASE}/users/me/messages/${messageId}/modify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
  });
}

export async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string
): Promise<void> {
  const raw = Buffer.from(
    `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`
  ).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  await fetch(`${GMAIL_API_BASE}/users/me/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });
}

export type { GmailMessage, GmailTokens };
