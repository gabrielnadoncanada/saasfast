import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  ForgotPasswordSchema,
} from "@/features/auth/shared/schema/auth.schema";
import { forgotPasswordAction } from "@/features/auth/forgot-password/actions/forgotPassword.action";
import { injectFieldErrors } from "@/shared/lib/injectFieldErrors";
import { useToastError } from "@/shared/hooks/useToastError";

export function useForgotPasswordForm() {
  const { serverError, setServerError, clearServerError } = useToastError();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordSchema) => {
    clearServerError();
    setIsLoading(true);

    const formData = new FormData();
    formData.append("email", data.email);

    const res = await forgotPasswordAction(formData);
    setIsLoading(false);

    if (!res.success) {
      setServerError(res.error || "Erreur inconnue");
      injectFieldErrors(form, res.fieldErrors);
      return false;
    }

    setIsSuccess(true);
    return true;
  };

  return { form, onSubmit, isLoading, isSuccess };
}
