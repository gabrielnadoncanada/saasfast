import { db, profiles } from "@/shared/db";
import { eq } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";

export async function ensureProfileExists(user: User): Promise<void> {
  await db
    .insert(profiles)
    .values({
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      avatarUrl: user.user_metadata?.avatar_url || null,
      emailConfirmedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        emailConfirmedAt: new Date(),
      },
    });
}