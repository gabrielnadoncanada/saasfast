import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  resetPasswordSchema,
  ResetPasswordSchema,
} from "@/features/auth/shared/schema/auth.schema";
import { resetPasswordAction } from "@/features/auth/reset-password/actions/resetPassword.action";
import { injectFieldErrors } from "@/shared/lib/injectFieldErrors";
import { useToastError } from "@/shared/hooks/useToastError";

export function useResetPasswordForm() {
  const { serverError, setServerError, clearServerError } = useToastError();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  const onSubmit = async (data: ResetPasswordSchema) => {
    clearServerError();
    setIsLoading(true);

    const formData = new FormData();
    formData.append("password", data.password);

    const res = await resetPasswordAction(formData);
    setIsLoading(false);

    if (!res.success) {
      setServerError(res.error || "Erreur inconnue");
      injectFieldErrors(form, res.fieldErrors);
      return false;
    }
    return true;
  };

  return { form, onSubmit, isLoading };
}
