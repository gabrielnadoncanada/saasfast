"use server";

import {
  ForgotPasswordSchema,
  forgotPasswordSchema,
} from "@/features/auth/shared/schema/auth.schema";
import { createClient } from "@/shared/api/supabase/server";
import { FormResult } from "@/shared/types/api.types";
import { safeParseForm } from "@/shared/lib/safeParseForm";
import { redirect } from "next/navigation";
import { getStatusRedirect } from "@/shared/lib/redirect";
import { AUTH_PATH } from "@/shared/constants/routes";

export async function forgotPasswordAction(
  formData: FormData
): Promise<FormResult<ForgotPasswordSchema>> {
  const parsed = await safeParseForm<ForgotPasswordSchema>(
    formData,
    forgotPasswordSchema
  );
  if (!parsed.success) return parsed;

  const { email } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/api/reset`,
  });

  if (error) {
    return { success: false, error: error.message ?? "Erreur inconnue" };
  }

  redirect(
    getStatusRedirect(
      AUTH_PATH,
      "Email envoyé.",
      "Vérifiez votre boîte de réception pour réinitialiser votre mot de passe."
    )
  );
}
