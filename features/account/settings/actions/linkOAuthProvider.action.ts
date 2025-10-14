"use server";

import { createClient } from "@/shared/db/supabase/server";
import { redirect } from "next/navigation";
import { getErrorRedirect } from "@/shared/lib/redirect";
import { ACCOUNT_SETTINGS_PATH } from "@/shared/constants/routes";
import type { Provider } from "@supabase/supabase-js";

export async function linkOAuthProvider(provider: Provider) {
  const supabase = await createClient();

  // Vérifier que l'utilisateur est authentifié
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(getErrorRedirect("/auth/login", "auth_error", "Non authentifié"));
  }

  const { data, error } = await supabase.auth.linkIdentity({
    provider,
    options: {
      redirectTo: `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }${ACCOUNT_SETTINGS_PATH}?success=${provider}_linked`,
    },
  });

  if (error) {
    redirect(
      getErrorRedirect(
        ACCOUNT_SETTINGS_PATH,
        `${provider}_link_error`,
        error.message ?? `Erreur lors de la liaison avec ${provider}`
      )
    );
  }

  if (data.url) {
    redirect(data.url);
  }
}
