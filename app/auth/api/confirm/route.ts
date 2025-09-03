import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { createClient } from "@/shared/db/supabase/server";
import { getStatusRedirect, getErrorRedirect } from "@/shared/lib/redirect";
import { redirect } from "next/navigation";
import { ensureProfileExists } from "@/features/auth/shared/lib/profile";

function safeRedirectUrl(url: string): string {
  // Vérifier que l'URL est définie et non vide
  if (!url || typeof url !== "string") {
    return "/";
  }

  // Empêcher les redirections vers des URLs externes
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("//")
  ) {
    return "/";
  }

  // Empêcher les redirections vers des protocoles dangereux
  if (url.includes(":") && !url.startsWith("/")) {
    return "/";
  }

  // S'assurer que l'URL commence par /
  return url.startsWith("/") ? url : "/";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeRedirectUrl(searchParams.get("next") ?? "/");

  if (!token_hash || !type) {
    redirect(
      getErrorRedirect(
        "/auth",
        "missing_token_or_type",
        "Le lien de vérification est invalide ou incomplet. Veuillez vous reconnecter."
      )
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    redirect(
      getErrorRedirect(
        "/auth",
        error.name ?? "invalid_token",
        error.message ??
          "Le lien est expiré ou invalide. Veuillez demander un nouvel e-mail."
      )
    );
  }

  // Créer le profil une fois que l'email est confirmé
  if (data.user) {
    try {
      await ensureProfileExists(data.user);
    } catch (e) {
      console.error("Erreur lors de la création du profil:", e);
    }
  }

  redirect(
    getStatusRedirect(
      next,
      "Authentification réussie.",
      "Vous êtes maintenant connecté."
    )
  );
}
