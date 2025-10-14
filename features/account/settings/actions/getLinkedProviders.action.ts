"use server";

import { createClient } from "@/shared/db/supabase/server";

export type LinkedProvider = {
  provider: string;
  email?: string;
  createdAt: string;
};

export type LinkedProvidersResult = {
  providers: LinkedProvider[];
  hasPassword: boolean;
};

export async function getLinkedProviders(): Promise<LinkedProvidersResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      providers: [],
      hasPassword: false,
    };
  }

  const identities = user.identities || [];

  // Vérifier si l'utilisateur a un mot de passe (provider "email")
  const hasPassword = identities.some((id) => id.provider === "email");

  // Mapper les providers OAuth (github, google, etc.)
  const providers: LinkedProvider[] = identities
    .filter((id) => id.provider !== "email")
    .map((id) => ({
      provider: id.provider,
      email: id.identity_data?.email as string | undefined,
      createdAt: id.created_at || new Date().toISOString(),
    }));

  return {
    providers,
    hasPassword,
  };
}
