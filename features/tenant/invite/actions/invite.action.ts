"use server";

import { db } from "@/shared/db/drizzle/db";
import { invitations } from "@/shared/db/drizzle/schema/invitations";
import { requireTenantContext } from "@/features/auth/shared/actions/getUserTenantData.action";
import { isUserOwnerOrAdmin } from "@/features/tenant/shared/lib/tenant";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { safeParseForm } from "@/shared/lib/safeParseForm";
import type { FormResult } from "@/shared/types/api.types";
import { randomBytes } from "crypto";

const inviteSchema = z.object({
  email: z.email("Email invalide"),
  role: z.enum(["ADMIN", "MEMBER", "BILLING_ADMIN"]), // Don't allow inviting as OWNER
});

type InviteSchema = z.infer<typeof inviteSchema>;

export async function inviteMemberAction(
  formData: FormData
): Promise<FormResult<InviteSchema>> {
  const parsed = await safeParseForm<InviteSchema>(formData, inviteSchema);
  if (!parsed.success) return parsed;

  const { email, role } = parsed.data;

  // Get current user context
  const context = await requireTenantContext();

  // Check if user has permission to invite
  if (!context.user?.authUser || !context.currentTenant) {
    return {
      success: false,
      error: "Contexte utilisateur ou tenant manquant.",
    };
  }

  const canInvite = await isUserOwnerOrAdmin(
    context.user.authUser.id,
    context.currentTenant.tenant.id
  );
  if (!canInvite) {
    return {
      success: false,
      error: "Vous n'avez pas les permissions pour inviter des membres.",
    };
  }

  // Check for existing invitation
  const existingInvite = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.tenantId, context.currentTenant.tenant.id),
        eq(invitations.email, email)
      )
    )
    .limit(1);

  // Generate secure token
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  try {
    if (existingInvite.length > 0) {
      // Update existing invitation (idempotent)
      await db
        .update(invitations)
        .set({
          role,
          token,
          expiresAt,
          createdAt: new Date(),
          acceptedAt: null,
        })
        .where(eq(invitations.id, existingInvite[0].id));
    } else {
      // Create new invitation
      await db.insert(invitations).values({
        tenantId: context.currentTenant.tenant.id,
        email,
        role,
        token,
        expiresAt,
      });
    }

    // TODO: Send invitation email
    // This will be implemented in Epic 4 (Transactional Emails)
    console.log(`Invitation sent to ${email} with token: ${token}`);

    return {
      success: true,
      data: { email, role },
    };
  } catch (error) {
    console.error("Error creating invitation:", error);
    return {
      success: false,
      error: "Erreur lors de l'envoi de l'invitation. Veuillez réessayer.",
    };
  }
}
