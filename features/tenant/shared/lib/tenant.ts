import { db, memberships } from "@/shared/db/drizzle/db";
import { eq, and } from "drizzle-orm";

/**
 * Check if a user has owner or admin privileges for a tenant
 */
export async function isUserOwnerOrAdmin(
  userId: string,
  tenantId: string
): Promise<boolean> {
  const membership = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.tenantId, tenantId),
        eq(memberships.status, "ACTIVE")
      )
    )
    .limit(1);

  if (membership.length === 0) {
    return false;
  }

  const role = membership[0].role;
  return role === "OWNER" || role === "ADMIN";
}

/**
 * Check if a user is the owner of a tenant
 */
export async function isUserOwner(
  userId: string,
  tenantId: string
): Promise<boolean> {
  const membership = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.tenantId, tenantId),
        eq(memberships.status, "ACTIVE")
      )
    )
    .limit(1);

  if (membership.length === 0) {
    return false;
  }

  return membership[0].role === "OWNER";
}
