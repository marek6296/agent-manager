import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens } from "@/lib/integrations/gmail";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${origin}/integrations?error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/integrations?error=no_code`);
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${origin}/login`);
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Check if integration already exists
    const { data: existing } = await supabase
      .from("integrations")
      .select("id")
      .eq("user_id", user.id)
      .eq("provider", "gmail")
      .single();

    if (existing) {
      // Update existing integration
      await supabase.from("integrations").update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: new Date(tokens.expiry_date).toISOString(),
        connected: true,
        scopes: ["gmail.readonly", "gmail.send"],
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id);
    } else {
      // Create new integration
      await supabase.from("integrations").insert({
        user_id: user.id,
        provider: "gmail",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: new Date(tokens.expiry_date).toISOString(),
        connected: true,
        scopes: ["gmail.readonly", "gmail.send"],
      });
    }

    return NextResponse.redirect(`${origin}/integrations?success=gmail`);
  } catch (err) {
    console.error("Gmail OAuth error:", err);
    return NextResponse.redirect(`${origin}/integrations?error=oauth_failed`);
  }
}
