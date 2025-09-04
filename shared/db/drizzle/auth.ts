import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/shared/db/supabase/server";
import { redirect } from "next/navigation";

export type ProfileRow = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

export type CurrentUser = {
  authUser: User;
  profile: ProfileRow | null;
} | null;

export const getCurrentUser = cache<() => Promise<CurrentUser>>(async () => {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, avatarUrl, createdAt")
    .eq("id", user.id)
    .single();

  return { authUser: user, profile: (profile as ProfileRow) ?? null };
});

export async function requireAuth(): Promise<NonNullable<CurrentUser>> {
  const current = await getCurrentUser();
  if (!current?.authUser) {
    throw new Error("Unauthorized");
  }
  return current;
}

export async function requireAuthOrRedirect() {
  const current = await getCurrentUser();
  if (!current?.authUser) redirect("/auth");
  return current;
}
