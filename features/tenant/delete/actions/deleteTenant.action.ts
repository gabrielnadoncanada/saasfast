"use server";

import { db } from "@/shared/db/drizzle/db";
import { tenants, memberships, profiles } from "@/shared/db/drizzle/schema";
import { requireTenantContext } from "@/features/auth/shared/actions/getUserTenantData.action";
import { isUserOwner } from "@/features/tenant/shared/lib/tenant";
import { eq, and, ne, isNull } from "drizzle-orm";
import { z } from "zod";
import { safeParseForm } from "@/shared/lib/safeParseForm";
import type { FormResult } from "@/shared/types/api.types";

const deleteTenantSchema = z.object({
  tenantId: z.string().uuid("ID de tenant invalide"),
});

type DeleteTenantSchema = z.infer<typeof deleteTenantSchema>;

export async function deleteTenantAction(
  formData: FormData
): Promise<FormResult<DeleteTenantSchema>> {
  const parsed = await safeParseForm<DeleteTenantSchema>(
    formData,
    deleteTenantSchema
  );
  if (!parsed.success) return parsed;

  const { tenantId } = parsed.data;

  // Get current user context
  const context = await requireTenantContext();

  if (!context.user?.authUser) {
    return {
      success: false,
      error: "Utilisateur non authentifié.",
    };
  }

  const userId = context.user.authUser.id;

  try {
    // 1. Vérifier que l'utilisateur est propriétaire du tenant à supprimer
    const isOwner = await isUserOwner(userId, tenantId);
    if (!isOwner) {
      return {
        success: false,
        error: "Vous devez être propriétaire du workspace pour le supprimer.",
      };
    }

    // 2. Vérifier que ce n'est pas le dernier tenant dont l'utilisateur est propriétaire
    const ownedTenants = await db
      .select({ id: tenants.id })
      .from(tenants)
      .innerJoin(memberships, eq(memberships.tenantId, tenants.id))
      .where(
        and(
          eq(memberships.userId, userId),
          eq(memberships.role, "OWNER"),
          eq(memberships.status, "ACTIVE"),
          isNull(tenants.deletedAt) // Exclure les tenants déjà supprimés
        )
      );

    if (ownedTenants.length <= 1) {
      return {
        success: false,
        error:
          "Vous ne pouvez pas supprimer votre dernier workspace. Vous devez en avoir au moins un.",
      };
    }

    // 3. Effectuer la suppression dans une transaction
    const result = await db.transaction(async (trx) => {
      // Soft delete du tenant (marquer comme supprimé)
      await trx
        .update(tenants)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenantId));

      // Désactiver tous les memberships de ce tenant
      await trx
        .update(memberships)
        .set({
          status: "REMOVED",
        })
        .where(eq(memberships.tenantId, tenantId));

      // 4. Si c'était le tenant actuel, changer vers un autre tenant
      let newCurrentTenantId = null;
      if (context.currentTenant?.tenant.id === tenantId) {
        // Trouver un autre tenant dont l'utilisateur est membre
        const availableTenants = await trx
          .select({ id: tenants.id })
          .from(tenants)
          .innerJoin(memberships, eq(memberships.tenantId, tenants.id))
          .where(
            and(
              eq(memberships.userId, userId),
              eq(memberships.status, "ACTIVE"),
              ne(tenants.id, tenantId), // Exclure le tenant qu'on vient de supprimer
              isNull(tenants.deletedAt) // Exclure les tenants supprimés
            )
          )
          .limit(1);

        if (availableTenants.length > 0) {
          newCurrentTenantId = availableTenants[0].id;

          // Mettre à jour le tenant courant de l'utilisateur
          await trx
            .update(profiles)
            .set({
              currentTenantId: newCurrentTenantId,
            })
            .where(eq(profiles.id, userId));
        }
      }

      return { newCurrentTenantId };
    });

    return {
      success: true,
      data: { tenantId },
    };
  } catch (error) {
    console.error("Error deleting tenant:", error);
    return {
      success: false,
      error: "Erreur lors de la suppression du workspace. Veuillez réessayer.",
    };
  }
}
