"use server";

import { memberships, profiles, invitations } from "@/shared/db/drizzle/db";
import { eq, and, desc, isNull } from "drizzle-orm";
import { withScopedDb } from "@/features/tenant/shared/lib/scoped-db";
import { withTenantScope } from "@/features/tenant/shared/lib/queries";

export async function getTeamMembersAction() {
  return await withScopedDb(async (scopedDb) => {
    // Get active members with tenant scoping
    const members = await scopedDb.db
      .select({
        id: memberships.id,
        role: memberships.role,
        status: memberships.status,
        createdAt: memberships.createdAt,
        user: {
          id: profiles.id,
          email: profiles.email,
          name: profiles.name,
          avatarUrl: profiles.avatarUrl,
        },
      })
      .from(memberships)
      .innerJoin(profiles, eq(profiles.id, memberships.userId))
      .where(withTenantScope(scopedDb, memberships.tenantId))
      .orderBy(desc(memberships.createdAt));

    // Get pending invitations with tenant scoping
    const pendingInvitations = await scopedDb.db
      .select()
      .from(invitations)
      .where(
        withTenantScope(
          scopedDb,
          invitations.tenantId,
          isNull(invitations.acceptedAt)
        )
      )
      .orderBy(desc(invitations.createdAt));

    return {
      members,
      pendingInvitations,
    };
  });
}
