"use server";

import { db, memberships } from "@/shared/db/drizzle/db";
import { eq, and, count } from "drizzle-orm";
import {
  getCurrentUserTenantContext,
  requireTenantContext,
} from "@/features/tenant/shared/lib/context";
import { isUserOwnerOrAdmin } from "@/features/tenant/shared/lib/tenant";
import { z } from "zod";
import { safeParseForm } from "@/shared/lib/safeParseForm";
import type { FormResult } from "@/shared/types/api.types";

const removeMemberSchema = z.object({
  membershipId: z.string().uuid("ID de membership invalide"),
});

type RemoveMemberSchema = z.infer<typeof removeMemberSchema>;

export async function removeMemberAction(
  formData: FormData
): Promise<FormResult<RemoveMemberSchema>> {
  const parsed = await safeParseForm<RemoveMemberSchema>(
    formData,
    removeMemberSchema
  );
  if (!parsed.success) return parsed;

  const { membershipId } = parsed.data;

  // Get current user context
  const context = await getCurrentUserTenantContext();
  requireTenantContext(context);

  // Check if user has permission to remove members
  const canRemoveMembers = await isUserOwnerOrAdmin(
    context.user.id,
    context.tenant.id
  );
  if (!canRemoveMembers) {
    return {
      success: false,
      error: "Vous n'avez pas les permissions pour supprimer des membres.",
    };
  }

  try {
    // Get the membership to verify it belongs to the tenant
    const membership = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.id, membershipId),
          eq(memberships.tenantId, context.tenant.id)
        )
      )
      .limit(1);

    if (membership.length === 0) {
      return {
        success: false,
        error: "Membre introuvable.",
      };
    }

    const targetMembership = membership[0];

    // Prevent owners from being removed unless by another owner
    if (
      targetMembership.role === "OWNER" &&
      context.membership.role !== "OWNER"
    ) {
      return {
        success: false,
        error:
          "Seuls les propriétaires peuvent supprimer un autre propriétaire.",
      };
    }

    // Prevent users from removing themselves if they are the only owner
    if (
      targetMembership.userId === context.user.id &&
      targetMembership.role === "OWNER"
    ) {
      const ownerCountResult = await db
        .select({ count: count() })
        .from(memberships)
        .where(
          and(
            eq(memberships.tenantId, context.tenant.id),
            eq(memberships.role, "OWNER"),
            eq(memberships.status, "ACTIVE")
          )
        );

      const ownerCount = ownerCountResult[0]?.count || 0;
      if (ownerCount <= 1) {
        return {
          success: false,
          error:
            "Vous ne pouvez pas vous supprimer en tant que seul propriétaire.",
        };
      }
    }

    // Update status to REMOVED instead of deleting
    await db
      .update(memberships)
      .set({ status: "REMOVED" })
      .where(eq(memberships.id, membershipId));

    return {
      success: true,
      data: { membershipId },
    };
  } catch (error) {
    console.error("Error removing member:", error);
    return {
      success: false,
      error: "Erreur lors de la suppression du membre. Veuillez réessayer.",
    };
  }
}
