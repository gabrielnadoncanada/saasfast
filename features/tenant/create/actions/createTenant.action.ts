"use server";

import { db } from "@/shared/db/drizzle/db";
import { tenants, memberships, profiles } from "@/shared/db/drizzle/schema";
import { requireTenantContext } from "@/features/auth/shared/actions/getUserTenantData.action";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { safeParseForm } from "@/shared/lib/safeParseForm";
import type { FormResult } from "@/shared/types/api.types";
import { redirect } from "next/navigation";

const createTenantSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom du workspace est requis")
    .max(255, "Le nom ne peut pas dépasser 255 caractères"),
});

type CreateTenantSchema = z.infer<typeof createTenantSchema>;

export async function createTenantAction(
  formData: FormData
): Promise<FormResult<CreateTenantSchema>> {
  const parsed = await safeParseForm<CreateTenantSchema>(
    formData,
    createTenantSchema
  );
  if (!parsed.success) return parsed;

  const { name } = parsed.data;

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
    // Create tenant and membership in a transaction
    const result = await db.transaction(async (trx) => {
      // 1. Create the new tenant
      const [newTenant] = await trx
        .insert(tenants)
        .values({
          name,
          ownerId: userId,
          plan: "FREE",
        })
        .returning();

      // 2. Create OWNER membership for the user
      await trx.insert(memberships).values({
        userId,
        tenantId: newTenant.id,
        role: "OWNER",
        status: "ACTIVE",
      });

      // 3. Update user's current tenant to the new one
      await trx
        .update(profiles)
        .set({
          currentTenantId: newTenant.id,
        })
        .where(eq(profiles.id, userId));

      return newTenant;
    });

    return {
      success: true,
      data: { name },
    };
  } catch (error) {
    console.error("Error creating tenant:", error);
    return {
      success: false,
      error: "Erreur lors de la création du workspace. Veuillez réessayer.",
    };
  }
}
