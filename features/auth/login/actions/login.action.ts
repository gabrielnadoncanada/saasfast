"use server";

import {
  LoginSchema,
  loginSchema,
} from "@/features/auth/shared/schema/auth.schema";
import { createClient } from "@/shared/api/supabase/server";
import { FormResult } from "@/shared/types/api.types";
import { safeParseForm } from "@/shared/lib/safeParseForm";
import { redirect } from "next/navigation";
import { getStatusRedirect } from "@/shared/lib/redirect";
import { DASHBOARD_PATH } from "@/shared/constants/routes";
import { loginRateLimit, getClientIP } from "@/shared/lib/rateLimit";
import { headers } from "next/headers";

export async function loginAction(
  formData: FormData
): Promise<FormResult<LoginSchema>> {
  const parsed = await safeParseForm<LoginSchema>(formData, loginSchema);
  if (!parsed.success) return parsed;

  const { email, password } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Éviter de révéler des informations sensibles sur l'existence des comptes
    return {
      success: false,
      error: "Email ou mot de passe incorrect.",
    };
  }

  redirect(
    getStatusRedirect(
      DASHBOARD_PATH,
      "Connexion réussie.",
      "Vous êtes maintenant connecté."
    )
  );
}
