import { db, tenants, memberships, profiles } from "@/shared/db/drizzle/db";
import { eq, and } from "drizzle-orm";

export async function getUserTenants(userId: string) {
  return await db
    .select({
      tenant: tenants,
      membership: memberships,
    })
    .from(memberships)
    .innerJoin(tenants, eq(tenants.id, memberships.tenantId))
    .where(
      and(eq(memberships.userId, userId), eq(memberships.status, "ACTIVE"))
    );
}

export async function getTenantMembers(tenantId: string) {
  return await db
    .select({
      profile: profiles,
      membership: memberships,
    })
    .from(memberships)
    .innerJoin(profiles, eq(profiles.id, memberships.userId))
    .where(eq(memberships.tenantId, tenantId));
}

export async function getUserRoleInTenant(userId: string, tenantId: string) {
  const result = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.tenantId, tenantId),
        eq(memberships.status, "ACTIVE")
      )
    )
    .limit(1);

  return result[0]?.role || null;
}

export async function isUserOwnerOrAdmin(
  userId: string,
  tenantId: string
): Promise<boolean> {
  const role = await getUserRoleInTenant(userId, tenantId);
  return role === "OWNER" || role === "ADMIN";
}
