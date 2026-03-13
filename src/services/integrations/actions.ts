"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getGmailAuthUrl } from "@/lib/integrations/gmail";

export async function getConnectUrl(provider: string) {
  if (provider === "gmail") {
    return getGmailAuthUrl();
  }
  throw new Error(`Provider ${provider} not supported`);
}

export async function disconnectIntegration(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("integrations").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/integrations");
  revalidatePath("/dashboard");
}
