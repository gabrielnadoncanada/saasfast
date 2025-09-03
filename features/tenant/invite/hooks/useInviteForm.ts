import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { inviteMemberAction } from "@/features/tenant/invite/actions/invite.action";
import { injectFieldErrors } from "@/shared/lib/injectFieldErrors";
import { useToastError } from "@/shared/hooks/useToastError";

const inviteSchema = z.object({
  email: z.string().email("Email invalide"),
  role: z.enum(["ADMIN", "MEMBER", "BILLING_ADMIN"]), // Don't allow inviting as OWNER
});

type InviteSchema = z.infer<typeof inviteSchema>;

export function useInviteForm() {
  const { serverError, setServerError, clearServerError } = useToastError();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<InviteSchema>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "MEMBER",
    },
  });

  const onSubmit = async (data: InviteSchema) => {
    clearServerError();
    setIsLoading(true);
    setIsSuccess(false);

    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("role", data.role);

    const res = await inviteMemberAction(formData);
    setIsLoading(false);

    if (!res.success) {
      setServerError(res.error || "Erreur inconnue");
      injectFieldErrors(form, res.fieldErrors);
      return false;
    }

    setIsSuccess(true);
    form.reset();
    return true;
  };

  return {
    form,
    onSubmit,
    isLoading,
    isSuccess,
  };
}
