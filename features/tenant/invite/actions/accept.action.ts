"use server";

import { db, invitations, memberships, profiles } from "@/shared/db/drizzle/db";
import { eq, and, gt, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getStatusRedirect, getErrorRedirect } from "@/shared/lib/redirect";
import { createClient } from "@/shared/db/supabase/server";
import { DASHBOARD_PATH } from "@/shared/constants/routes";

export async function acceptInvitationAction(token: string) {
  if (!token) {
    redirect(
      getErrorRedirect(
        "/auth",
        "invalid_token",
        "Le lien d'invitation est invalide."
      )
    );
  }

  // Get the invitation
  const invitation = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.token, token),
        gt(invitations.expiresAt, new Date()), // Not expired
        isNull(invitations.acceptedAt) // Not already accepted
      )
    )
    .limit(1);

  if (invitation.length === 0) {
    redirect(
      getErrorRedirect(
        "/auth",
        "invitation_not_found",
        "Cette invitation n'existe pas ou a expiré."
      )
    );
  }

  const invite = invitation[0];
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    // User needs to be authenticated first
    redirect(
      getErrorRedirect(
        "/auth",
        "authentication_required",
        "Vous devez être connecté pour accepter cette invitation."
      )
    );
  }

  // Check if user's email matches the invitation
  if (user.email !== invite.email) {
    redirect(
      getErrorRedirect(
        "/auth",
        "email_mismatch",
        "Cette invitation est destinée à une autre adresse e-mail."
      )
    );
  }

  try {
    await db.transaction(async (trx) => {
      // Check if user already has membership in this tenant
      const existingMembership = await trx
        .select()
        .from(memberships)
        .where(
          and(
            eq(memberships.userId, user.id),
            eq(memberships.tenantId, invite.tenantId)
          )
        )
        .limit(1);

      if (existingMembership.length > 0) {
        // Update existing membership
        await trx
          .update(memberships)
          .set({
            role: invite.role,
            status: "ACTIVE",
          })
          .where(eq(memberships.id, existingMembership[0].id));
      } else {
        // Create new membership
        await trx.insert(memberships).values({
          userId: user.id,
          tenantId: invite.tenantId,
          role: invite.role,
          status: "ACTIVE",
        });
      }

      // Mark invitation as accepted
      await trx
        .update(invitations)
        .set({
          acceptedAt: new Date(),
        })
        .where(eq(invitations.id, invite.id));
    });

    redirect(
      getStatusRedirect(
        DASHBOARD_PATH,
        "Invitation acceptée !",
        "Vous faites maintenant partie de l'équipe."
      )
    );
  } catch (error) {
    console.error("Error accepting invitation:", error);
    redirect(
      getErrorRedirect(
        "/auth",
        "invitation_accept_error",
        "Erreur lors de l'acceptation de l'invitation. Veuillez réessayer."
      )
    );
  }
}
