"use server";

import {
  LoginSchema,
  loginSchema,
} from "@/features/auth/shared/schema/auth.schema";
import { createClient } from "@/shared/api/supabase/server";
import { FormResult } from "@/shared/types/api.types";
import { safeParseForm } from "@/shared/lib/safeParseForm";

export async function loginAction(
  formData: FormData
): Promise<FormResult<LoginSchema>> {
  const parsed = await safeParseForm<LoginSchema>(formData, loginSchema);
  if (!parsed.success) return parsed;

  const { email, password } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, error: error.message ?? "Erreur inconnue" };
  }

  return { success: true, data: parsed.data };
}
