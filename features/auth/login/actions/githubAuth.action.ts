"use server";

import { createClient } from "@/shared/db/supabase/server";
import { redirect } from "next/navigation";
import { getErrorRedirect } from "@/shared/lib/redirect";
import { AUTH_CALLBACK_PATH, AUTH_PATH } from "@/shared/constants/routes";

export async function signInWithGithub() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }${AUTH_CALLBACK_PATH}`,
    },
  });

  if (error) {
    redirect(
      getErrorRedirect(
        AUTH_PATH,
        "github_auth_error",
        error.message ?? "Erreur lors de l'authentification avec GitHub"
      )
    );
  }

  if (data.url) {
    redirect(data.url);
  }
}
