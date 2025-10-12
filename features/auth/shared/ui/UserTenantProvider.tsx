"use client";

import { AUTH_PATH } from "@/shared/constants/routes";
import { createClient } from "@/shared/db/supabase/client";
import { getStatusRedirect } from "@/shared/lib/redirect";
import { redirect, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import type { Tenant, Profile } from "@/shared/db/drizzle/schema";
import type { InitialUserTenantData } from "@/features/auth/shared/actions/getUserTenantData.action";
import {
  refreshUserTenants,
  switchTenant as switchTenantAction,
} from "@/features/auth/shared/actions/getUserTenantData.action";

// Types pour l'utilisateur avec profil
export type UserWithProfile = {
  authUser: User;
  profile: Profile;
};

// Type pour tenant avec membership et permissions
export type TenantWithProfile = {
  tenant: Tenant;
  membership: {
    id: string;
    role: "OWNER" | "ADMIN" | "MEMBER" | "BILLING_ADMIN";
    status: "ACTIVE" | "INVITED" | "REMOVED";
    createdAt: Date;
  };
  isOwner: boolean;
  isAdmin: boolean;
  canManageMembers: boolean;
  canManageSettings: boolean;
};

// Context principal
type UserTenantContextType = {
  user: UserWithProfile;
  logout: () => Promise<void>;
  currentTenant: TenantWithProfile | null;
  tenants: TenantWithProfile[];
  isLoadingTenants: boolean;
  switchTenant: (tenantId: string) => Promise<void>;
  refreshTenants: () => Promise<void>;
  // Permissions directement du currentTenant
  isOwner: boolean;
  isAdmin: boolean;
  canManageMembers: boolean;
  canManageSettings: boolean;
  hasAnyPermission: boolean;
};

const UserTenantContext = createContext<UserTenantContextType | undefined>(
  undefined
);

// Fonction logout réutilisable
export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect(
    getStatusRedirect(
      AUTH_PATH,
      "Déconnexion réussie.",
      "Vous êtes maintenant déconnecté."
    )
  );
}

// Type pour les données garanties du layout protégé
type GuaranteedUserTenantData = {
  user: UserWithProfile;
  currentTenant: TenantWithProfile | null;
  tenants: TenantWithProfile[];
};

interface UserTenantProviderProps {
  initialData: GuaranteedUserTenantData;
  children: React.ReactNode;
}

export function UserTenantProvider({
  initialData,
  children,
}: UserTenantProviderProps) {
  const supabase = createClient();
  const router = useRouter();

  // States initialisés directement avec les données
  // Maintenant user ne peut être que UserWithProfile (pas null) car requireTenantContext garantit les données
  const [user] = useState<UserWithProfile>(initialData.user);
  const [currentTenant, setCurrentTenant] = useState<TenantWithProfile | null>(
    initialData.currentTenant
  );
  const [tenants, setTenants] = useState<TenantWithProfile[]>(
    initialData.tenants
  );
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);

  // Écouter les changements d'authentification
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "INITIAL_SESSION") return;

        // Si l'utilisateur se déconnecte, rediriger vers auth
        if (!session?.user) {
          redirect("/auth");
        }

        // Sinon, rafraîchir la page pour recharger les données
        router.refresh();
      }
    );
    return () => sub.subscription.unsubscribe();
  }, [supabase, router]);

  const switchTenant = useCallback(
    async (tenantId: string) => {
      if (tenantId === currentTenant?.tenant.id) return;

      setIsLoadingTenants(true);
      try {
        // Trouver le tenant dans la liste
        const newTenant = tenants.find((t) => t.tenant.id === tenantId);
        if (!newTenant) {
          throw new Error("Tenant non trouvé");
        }

        // Appeler la server action pour mettre à jour le tenant
        await switchTenantAction(tenantId);

        // Mettre à jour l'état local
        setCurrentTenant(newTenant);

        // Rafraîchir la page pour mettre à jour toutes les données
        router.refresh();
      } catch (error) {
        console.error("Erreur lors du changement de tenant:", error);
        // TODO: Gérer l'erreur avec un toast
      } finally {
        setIsLoadingTenants(false);
      }
    },
    [currentTenant?.tenant.id, tenants, router]
  );

  const refreshTenants = useCallback(async () => {
    setIsLoadingTenants(true);
    try {
      const data = await refreshUserTenants();
      setTenants(data.tenants);
      setCurrentTenant(data.currentTenant);
    } catch (error) {
      console.error("Erreur lors de la récupération des tenants:", error);
    } finally {
      setIsLoadingTenants(false);
    }
  }, []);

  const value = useMemo<UserTenantContextType>(
    () => ({
      user,
      logout,
      currentTenant,
      tenants,
      isLoadingTenants,
      switchTenant,
      refreshTenants,
      // Permissions directement du currentTenant
      isOwner: currentTenant?.isOwner ?? false,
      isAdmin: currentTenant?.isAdmin ?? false,
      canManageMembers: currentTenant?.canManageMembers ?? false,
      canManageSettings: currentTenant?.canManageSettings ?? false,
      hasAnyPermission:
        currentTenant?.isOwner || currentTenant?.isAdmin || false,
    }),
    [
      user,
      currentTenant,
      tenants,
      isLoadingTenants,
      switchTenant,
      refreshTenants,
    ]
  );

  return (
    <UserTenantContext.Provider value={value}>
      {children}
    </UserTenantContext.Provider>
  );
}

// Hook principal - maintenant c'est useUser qui contient tout
export function useUser() {
  const context = useContext(UserTenantContext);
  if (!context) {
    throw new Error("useUser must be used within a UserTenantProvider");
  }
  return context;
}

// Hook pour exiger un tenant actuel
export function useRequiredTenant() {
  const { currentTenant, isLoadingTenants } = useUser();

  if (isLoadingTenants) {
    throw new Error("Tenant context is loading");
  }

  if (!currentTenant) {
    throw new Error("No current tenant available");
  }

  return currentTenant;
}
