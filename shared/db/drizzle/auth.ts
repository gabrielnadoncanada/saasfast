import { createClient } from "@/shared/db/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();

  if (!supabase) {
    return null;
  }

  const { data: authData } = await supabase.auth.getUser();
  return authData?.user?.id || null;
}

export async function requireAuth() {
  const userId = await getCurrentUser();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}
