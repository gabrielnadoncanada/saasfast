"use server";

import { createClient } from "@/shared/db/supabase/server";
import { db, profiles, tenants, memberships } from "@/shared/db/drizzle/db";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import type {
  UserWithProfile,
  TenantWithProfile,
} from "../ui/UserTenantProvider";

// Action principale pour récupérer les données initiales côté serveur
export async function getInitialUserTenantData() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, currentTenant: null, tenants: [] };
  }

  // Récupérer le profil utilisateur
  const userProfile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  const profile = userProfile[0];

  if (!profile) {
    return {
      user: { authUser: user, profile: null },
      currentTenant: null,
      tenants: [],
    };
  }

  const userWithProfile: UserWithProfile = {
    authUser: user,
    profile,
  };

  // Récupérer tous les tenants de l'utilisateur
  const userTenants = await getUserTenants(user.id);
  if (userTenants.length === 0) {
    return {
      user: userWithProfile,
      currentTenant: null,
      tenants: [],
    };
  }

  // Déterminer le tenant courant
  let currentTenant = profile.currentTenantId
    ? userTenants.find((t) => t.tenant.id === profile.currentTenantId) ||
      userTenants[0]
    : userTenants[0];

  // Mettre à jour le currentTenantId si nécessaire
  if (currentTenant && !profile.currentTenantId) {
    await db
      .update(profiles)
      .set({ currentTenantId: currentTenant.tenant.id })
      .where(eq(profiles.id, user.id));
  }

  return {
    user: userWithProfile,
    currentTenant,
    tenants: userTenants,
  };
}

export async function getUserTenants(
  userId: string
): Promise<TenantWithProfile[]> {
  const results = await db
    .select({ tenant: tenants, membership: memberships })
    .from(memberships)
    .innerJoin(tenants, eq(tenants.id, memberships.tenantId))
    .where(
      and(eq(memberships.userId, userId), eq(memberships.status, "ACTIVE"))
    )
    .orderBy(memberships.createdAt);

  return results.map(({ tenant, membership }) => {
    const isOwner = membership.role === "OWNER";
    const isAdmin = membership.role === "ADMIN" || isOwner;

    return {
      tenant,
      membership: {
        id: membership.id,
        role: membership.role,
        status: membership.status,
        createdAt: membership.createdAt,
      },
      isOwner,
      isAdmin,
      canManageMembers: isOwner || isAdmin,
      canManageSettings: isOwner,
    };
  });
}

export async function requireTenantContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth");
  }

  // Récupérer le profil utilisateur
  const userProfile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  const profile = userProfile[0];
  if (!profile) {
    redirect("/auth/setup-profile"); // À créer
  }

  // Récupérer tous les tenants de l'utilisateur
  const userTenants = await getUserTenants(user.id);
  console.log("userTenants", userTenants);
  if (userTenants.length === 0) {
    redirect("/auth/setup-tenant"); // À créer
  }

  // Déterminer le tenant courant
  let currentTenant = profile.currentTenantId
    ? userTenants.find((t) => t.tenant.id === profile.currentTenantId) ||
      userTenants[0]
    : userTenants[0];

  // Mettre à jour le currentTenantId si nécessaire
  if (currentTenant && !profile.currentTenantId) {
    await db
      .update(profiles)
      .set({ currentTenantId: currentTenant.tenant.id })
      .where(eq(profiles.id, user.id));
  }

  const userWithProfile = { authUser: user, profile };

  return {
    user: userWithProfile,
    currentTenant,
    tenants: userTenants,
  };
}

export async function requireTenantAccess(tenantId: string, userId: string) {
  const [membership] = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.tenantId, tenantId),
        eq(memberships.userId, userId),
        eq(memberships.status, "ACTIVE")
      )
    )
    .limit(1);

  if (!membership) throw new Error("Access denied to this tenant");
  return membership;
}

export async function updateCurrentTenant(userId: string, tenantId: string) {
  await requireTenantAccess(tenantId, userId);
  await db
    .update(profiles)
    .set({ currentTenantId: tenantId })
    .where(eq(profiles.id, userId));
}

// Action pour rafraîchir les données tenant depuis le client
export async function refreshUserTenants() {
  const data = await getInitialUserTenantData();

  if (!data.user) {
    throw new Error("User not authenticated");
  }

  return {
    currentTenant: data.currentTenant,
    tenants: data.tenants,
  };
}

// Action pour changer de tenant depuis le client
export async function switchTenant(tenantId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("User not authenticated");
  }

  if (!tenantId) {
    throw new Error("tenantId is required");
  }

  // Mettre à jour le tenant courant
  await updateCurrentTenant(user.id, tenantId);

  return { success: true };
}

export type InitialUserTenantData = Awaited<
  ReturnType<typeof getInitialUserTenantData>
>;
export type RequiredTenantContext = Awaited<
  ReturnType<typeof requireTenantContext>
>;
