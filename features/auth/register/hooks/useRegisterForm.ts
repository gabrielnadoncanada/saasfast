import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerSchema,
  RegisterSchema,
} from "@/features/auth/shared/schema/auth.schema";
import { registerAction } from "@/features/auth/register/actions/register.action";
import { injectFieldErrors } from "@/shared/lib/injectFieldErrors";
import { useToastError } from "@/shared/lib/hooks/useToastError";

export function useRegisterForm() {
  const { serverError, setServerError, clearServerError } = useToastError();

  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: RegisterSchema) => {
    clearServerError();
    const formData = new FormData();
    formData.append("full_name", data.full_name);
    formData.append("email", data.email);
    formData.append("password", data.password);

    const res = await registerAction(formData);

    if (!res.success) {
      setServerError(res.error || "Erreur inconnue");
      injectFieldErrors(form, res.fieldErrors);
      return false;
    }
    return true;
  };

  return { form, onSubmit };
}
