import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  LoginSchema,
} from "@/features/auth/shared/schema/auth.schema";
import { loginAction } from "@/features/auth/login/actions/login.action";
import { injectFieldErrors } from "@/shared/lib/injectFieldErrors";
import { useToastError } from "@/shared/hooks/useToastError";

export function useLoginForm() {
  const { serverError, setServerError, clearServerError } = useToastError();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginSchema) => {
    clearServerError();
    setIsLoading(true);

    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);

    const res = await loginAction(formData);
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
