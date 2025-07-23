import { prisma } from "@/shared/api/prisma";
import type { User } from "@supabase/supabase-js";

export async function ensureProfileExists(user: User): Promise<void> {
  await prisma.profile.upsert({
    where: { id: user.id },
    update: {
      emailConfirmedAt: new Date(),
    },
    create: {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      avatarUrl: user.user_metadata?.avatar_url || null,
      emailConfirmedAt: new Date(),
    },
  });
}