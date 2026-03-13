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
  // Build query: only fetch unread emails, optionally newer than afterDate
  let q = "is:unread";
  if (afterDate) {
    q += ` after:${Math.floor(afterDate.getTime() / 1000)}`;
  }
  if (skipAutomated) {
    // Exclude automated senders and categories
    q += [
      " -from:noreply",
      " -from:no-reply",
      " -from:notifications",
      " -from:notification",
      " -from:donotreply",
      " -from:do-not-reply",
      " -from:mailer",
      " -from:bounce",
      " -from:automated",
      " -from:newsletter",
      " -from:alerts",
      " -from:support@vercel",
      " -from:github",
      " -category:promotions",
      " -category:updates",
    ].join("");
  }
  const listResponse = await fetch(
    `${GMAIL_API_BASE}/users/me/messages?maxResults=${maxResults}&labelIds=INBOX&q=${encodeURIComponent(q)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const listData = await listResponse.json();
  if (!listData.messages) return [];

  const messages: GmailMessage[] = [];
  for (const msg of listData.messages) {
    const msgResponse = await fetch(
      `${GMAIL_API_BASE}/users/me/messages/${msg.id}?format=full`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const msgData = await msgResponse.json();

    const headers = msgData.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h: { name: string; value: string }) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

    let body = "";
    if (msgData.payload?.body?.data) {
      body = Buffer.from(msgData.payload.body.data, "base64").toString("utf-8");
    } else if (msgData.payload?.parts) {
      const textPart = msgData.payload.parts.find(
        (p: { mimeType: string }) => p.mimeType === "text/plain"
      );
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
      }
    }

    messages.push({
      id: msgData.id,
      threadId: msgData.threadId,
      snippet: msgData.snippet,
      subject: getHeader("Subject"),
      from: getHeader("From"),
      to: getHeader("To"),
      date: getHeader("Date"),
      body,
      labels: msgData.labelIds || [],
    });
  }

  return messages;
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
