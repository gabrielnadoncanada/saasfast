"use server";

import { db, memberships } from "@/shared/db/drizzle/db";
import { eq, and } from "drizzle-orm";
import { requireTenantContext } from "@/features/auth/shared/actions/getUserTenantData.action";
import { isUserOwnerOrAdmin } from "@/features/tenant/shared/lib/tenant";
import { z } from "zod";
import { safeParseForm } from "@/shared/lib/safeParseForm";
import type { FormResult } from "@/shared/types/api.types";

const updateRoleSchema = z.object({
  membershipId: z.string().uuid("ID de membership invalide"),
  newRole: z.enum(["OWNER", "ADMIN", "MEMBER", "BILLING_ADMIN"]),
});

type UpdateRoleSchema = z.infer<typeof updateRoleSchema>;

export async function updateMemberRoleAction(
  formData: FormData
): Promise<FormResult<UpdateRoleSchema>> {
  const parsed = await safeParseForm<UpdateRoleSchema>(
    formData,
    updateRoleSchema
  );
  if (!parsed.success) return parsed;

  const { membershipId, newRole } = parsed.data;

  // Get current user context
  const context = await requireTenantContext();

  // Check if user has permission to change roles
  if (!context.user?.authUser || !context.currentTenant) {
    return {
      success: false,
      error: "Contexte utilisateur ou tenant manquant.",
    };
  }

  const canChangeRoles = await isUserOwnerOrAdmin(
    context.user.authUser.id,
    context.currentTenant.tenant.id
  );
  if (!canChangeRoles) {
    return {
      success: false,
      error: "Vous n'avez pas les permissions pour modifier les rôles.",
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
          eq(memberships.tenantId, context.currentTenant.tenant.id)
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

    // Prevent owners from being downgraded unless by another owner
    if (
      targetMembership.role === "OWNER" &&
      context.currentTenant.membership.role !== "OWNER"
    ) {
      return {
        success: false,
        error:
          "Seuls les propriétaires peuvent modifier le rôle d'un autre propriétaire.",
      };
    }

    // Prevent users from promoting someone to owner (only owners can do that)
    if (
      newRole === "OWNER" &&
      context.currentTenant!.membership.role !== "OWNER"
    ) {
      return {
        success: false,
        error:
          "Seuls les propriétaires peuvent promouvoir quelqu'un au rôle de propriétaire.",
      };
    }

    // Update the role
    await db
      .update(memberships)
      .set({ role: newRole })
      .where(eq(memberships.id, membershipId));

    return {
      success: true,
      data: { membershipId, newRole },
    };
  } catch (error) {
    console.error("Error updating member role:", error);
    return {
      success: false,
      error: "Erreur lors de la modification du rôle. Veuillez réessayer.",
    };
  }
}
