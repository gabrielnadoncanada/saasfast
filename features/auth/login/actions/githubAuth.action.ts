"use server";

import { createClient } from "@/shared/api/supabase/server";
import { redirect } from "next/navigation";
import { getErrorRedirect } from "@/shared/lib/redirect";

export async function signInWithGithub() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }/auth/api/callback`,
    },
  });

  if (error) {
    redirect(
      getErrorRedirect(
        "/auth",
        "github_auth_error",
        error.message ?? "Erreur lors de l'authentification avec GitHub"
      )
    );
  }

  if (data.url) {
    redirect(data.url);
  }
}
