"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createWorkflow(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string || "";

  const { data, error } = await supabase.from("workflows").insert({
    user_id: user.id,
    name,
    description,
    nodes_json: [],
    edges_json: [],
    active: false,
  }).select().single();

  if (error) throw new Error(error.message);
  revalidatePath("/workflows");
  return data;
}

export async function updateWorkflow(
  id: string,
  data: { name?: string; description?: string; nodes_json?: unknown[]; edges_json?: unknown[]; active?: boolean }
) {
  const supabase = await createClient();

  const { error } = await supabase.from("workflows").update({
    ...data,
    updated_at: new Date().toISOString(),
  }).eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/workflows");
}

export async function deleteWorkflow(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("workflows").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/workflows");
  revalidatePath("/dashboard");
}

export async function toggleWorkflowActive(id: string, active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("workflows").update({
    active,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/workflows");
  revalidatePath("/dashboard");
}
