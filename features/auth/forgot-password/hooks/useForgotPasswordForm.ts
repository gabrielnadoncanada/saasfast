import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  ForgotPasswordSchema,
} from "@/features/auth/shared/schema/auth.schema";
import { forgotPasswordAction } from "@/features/auth/forgot-password/actions/forgotPassword.action";
import { useFormAction } from "@/shared/hooks/useFormAction";

export function useForgotPasswordForm() {
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const { submitForm, isLoading, actionState } = useFormAction(
    forgotPasswordAction,
    form
  );

  useEffect(() => {
    if (actionState?.success) {
      setIsSuccess(true);
    } else {
      setIsSuccess(false);
    }
  }, [actionState]);

  return {
    form,
    onSubmit: submitForm,
    isLoading,
    isSuccess,
    actionState,
  };
}
