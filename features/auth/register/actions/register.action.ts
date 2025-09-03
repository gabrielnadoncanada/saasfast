"use server";

import {
  RegisterSchema,
  registerSchema,
} from "@/features/auth/shared/schema/auth.schema";
import { safeParseForm } from "@/shared/lib/safeParseForm";
import type { FormResult } from "@/shared/types/api.types";
import { createClient } from "@/shared/db/supabase/server";
import { getStatusRedirect } from "@/shared/lib/redirect";
import { redirect } from "next/navigation";
import { AUTH_PATH } from "@/shared/constants/routes";

export async function registerAction(
  formData: FormData
): Promise<FormResult<RegisterSchema>> {
  const parsed = await safeParseForm<RegisterSchema>(formData, registerSchema);
  if (!parsed.success) return parsed;

  const { email, password, full_name } = parsed.data;

  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/api/confirm`,
    },
  });

  if (authError) {
    // Normaliser les messages d'erreur pour éviter l'énumération d'utilisateurs
    if (
      authError.message.includes("already registered") ||
      authError.message.includes("already exists")
    ) {
      return {
        success: false,
        error: "Cette adresse e-mail est déjà utilisée.",
      };
    }
    return {
      success: false,
      error:
        "Une erreur est survenue lors de la création du compte. Veuillez réessayer.",
    };
  }

  // Le profil sera créé lors de la confirmation email
  // Voir: /auth/api/confirm/route.ts

  redirect(
    getStatusRedirect(
      AUTH_PATH,
      "Votre compte a été créé !",
      "Vérifiez votre e-mail pour confirmer votre inscription. Connectez-vous dès que vous avez validé votre adresse."
    )
  );
}
