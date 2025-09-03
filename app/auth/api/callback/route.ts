import { createClient } from "@/shared/db/supabase/server";
import { getStatusRedirect, getErrorRedirect } from "@/shared/lib/redirect";
import { DASHBOARD_PATH } from "@/shared/constants/routes";
import { ensureProfileExists } from "@/features/auth/shared/lib/profile";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? DASHBOARD_PATH;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      try {
        await ensureProfileExists(data.user);
      } catch (e) {
        console.error("Erreur lors de la création du profil OAuth:", e);
      }

      redirect(
        getStatusRedirect(
          next,
          "Connexion réussie",
          "Vous êtes maintenant connecté avec GitHub."
        )
      );
    }
  }

  redirect(
    getErrorRedirect(
      "/auth",
      "auth_callback_error",
      "Erreur lors de l'authentification. Veuillez réessayer."
    )
  );
}
