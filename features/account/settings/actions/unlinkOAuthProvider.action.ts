"use server";

import { createClient } from "@/shared/db/supabase/server";
import { revalidatePath } from "next/cache";
import { ACCOUNT_SETTINGS_PATH } from "@/shared/constants/routes";
import type { Provider } from "@supabase/supabase-js";

type UnlinkProviderResult = {
  success: boolean;
  message?: string;
};

export async function unlinkOAuthProvider(
  provider: Provider
): Promise<UnlinkProviderResult> {
  try {
    const supabase = await createClient();

    // Vérifier que l'utilisateur est authentifié
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        message: "Non authentifié",
      };
    }

    // Récupérer les identités liées
    const identities = user.identities || [];
    const providerIdentity = identities.find((id) => id.provider === provider);

    if (!providerIdentity) {
      return {
        success: false,
        message: `Aucun compte ${provider} lié`,
      };
    }

    // Vérifier qu'il reste au moins une autre méthode de connexion
    if (identities.length <= 1) {
      return {
        success: false,
        message:
          "Impossible de délier : vous devez garder au moins une méthode de connexion",
      };
    }

    // Délier l'identité
    const { error } = await supabase.auth.unlinkIdentity(providerIdentity);

    if (error) {
      return {
        success: false,
        message: error.message ?? `Erreur lors de la déliaison avec ${provider}`,
      };
    }

    revalidatePath(ACCOUNT_SETTINGS_PATH);

    return {
      success: true,
      message: `Compte ${provider} délié avec succès`,
    };
  } catch (error) {
    return {
      success: false,
      message: "Une erreur inattendue s'est produite",
    };
  }
}
