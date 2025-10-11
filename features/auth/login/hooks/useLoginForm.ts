import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  LoginSchema,
} from "@/features/auth/shared/schema/auth.schema";
import { loginAction } from "@/features/auth/login/actions/login.action";
import { useFormAction } from "@/shared/hooks/useFormAction";

export function useLoginForm() {
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { submitForm, isLoading, actionState } = useFormAction(
    loginAction,
    form
  );

  return {
    form,
    onSubmit: submitForm,
    isLoading,
    actionState,
  };
}
