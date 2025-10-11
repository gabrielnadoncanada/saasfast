import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  resetPasswordSchema,
  ResetPasswordSchema,
} from "@/features/auth/shared/schema/auth.schema";
import { resetPasswordAction } from "@/features/auth/reset-password/actions/resetPassword.action";
import { useFormAction } from "@/shared/hooks/useFormAction";

export function useResetPasswordForm() {
  const form = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  const { submitForm, isLoading, actionState } = useFormAction(
    resetPasswordAction,
    form
  );

  return {
    form,
    onSubmit: submitForm,
    isLoading,
    actionState,
  };
}
