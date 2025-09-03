import { db, profiles, tenants, memberships } from "@/shared/db/drizzle/db";
import { eq } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";

export async function ensureProfileExists(user: User): Promise<void> {
  await db.transaction(async (trx) => {
    // 1. Create or update the profile
    const [profile] = await trx
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
      })
      .returning();

    // 2. Check if user already has a tenant (for existing users)
    const existingTenant = await trx
      .select()
      .from(tenants)
      .where(eq(tenants.ownerId, user.id))
      .limit(1);

    if (existingTenant.length === 0) {
      // 3. Create a default tenant for the user
      const [tenant] = await trx
        .insert(tenants)
        .values({
          name: `${user.user_metadata?.full_name || user.email}'s Workspace`,
          ownerId: user.id,
          plan: "FREE",
        })
        .returning();

      // 4. Create OWNER membership for the user
      await trx.insert(memberships).values({
        userId: user.id,
        tenantId: tenant.id,
        role: "OWNER",
        status: "ACTIVE",
      });
    }
  });
}
