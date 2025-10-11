import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerSchema,
  RegisterSchema,
} from "@/features/auth/shared/schema/auth.schema";
import { registerAction } from "@/features/auth/register/actions/register.action";
import { useFormAction } from "@/shared/hooks/useFormAction";

export function useRegisterForm() {
  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
    },
  });

  const { submitForm, isLoading, actionState } = useFormAction(
    registerAction,
    form
  );

  return {
    form,
    onSubmit: submitForm,
    isLoading,
    actionState,
  };
}
