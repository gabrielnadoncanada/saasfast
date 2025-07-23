"use server";

import { createClient } from "@/shared/api/supabase/server";
import { redirect } from "next/navigation";
import { AUTH_PATH } from "@/shared/constants/routes";
import { getStatusRedirect } from "@/shared/lib/redirect";

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(
    getStatusRedirect(
      AUTH_PATH,
      "Déconnexion réussie.",
      "Vous êtes maintenant déconnecté."
    )
  );
}
