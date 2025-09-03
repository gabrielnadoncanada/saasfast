"use server";

import {
  ResetPasswordSchema,
  resetPasswordSchema,
} from "@/features/auth/shared/schema/auth.schema";
import { createClient } from "@/shared/db/supabase/server";
import { FormResult } from "@/shared/types/api.types";
import { safeParseForm } from "@/shared/lib/safeParseForm";
import { getStatusRedirect } from "@/shared/lib/redirect";
import { redirect } from "next/navigation";
import { AUTH_PATH, DASHBOARD_PATH } from "@/shared/constants/routes";

export async function resetPasswordAction(
  formData: FormData
): Promise<FormResult<ResetPasswordSchema>> {
  const parsed = await safeParseForm<ResetPasswordSchema>(
    formData,
    resetPasswordSchema
  );
  if (!parsed.success) return parsed;

  const { password } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("Reset password error:", error.message);
    return {
      success: false,
      error:
        "Une erreur est survenue lors de la réinitialisation. Veuillez réessayer.",
    };
  }

  redirect(
    getStatusRedirect(
      DASHBOARD_PATH,
      "Mot de passe réinitialisé.",
      "Vous êtes maintenant connecté avec votre nouveau mot de passe."
    )
  );
}
