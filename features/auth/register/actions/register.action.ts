"use server";

import {
  RegisterSchema,
  registerSchema,
} from "@/features/auth/shared/schema/auth.schema";
import { safeParseForm } from "@/shared/lib/safeParseForm";
import type { FormResult } from "@/shared/types/api.types";
import { createClient } from "@/shared/api/supabase/server";
import { prisma } from "@/shared/api/prisma";
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
    return { success: false, error: authError.message };
  }

  if (authData.user) {
    try {
      await prisma.profile.create({
        data: {
          id: authData.user.id,
          email,
          name: full_name,
        },
      });
    } catch (e: any) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: e.message || "Erreur profile Prisma" };
    }
  }

  redirect(
    getStatusRedirect(
      AUTH_PATH,
      "Votre compte a été créé !",
      "Vérifiez votre e-mail pour confirmer votre inscription. Connectez-vous dès que vous avez validé votre adresse."
    )
  );
}
