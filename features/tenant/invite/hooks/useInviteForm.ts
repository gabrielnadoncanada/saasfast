import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { inviteMemberAction } from "@/features/tenant/invite/actions/invite.action";
import { useFormAction } from "@/shared/hooks/useFormAction";

const inviteSchema = z.object({
  email: z.string().email("Email invalide"),
  role: z.enum(["ADMIN", "MEMBER", "BILLING_ADMIN"]), // Don't allow inviting as OWNER
});

type InviteSchema = z.infer<typeof inviteSchema>;

export function useInviteForm() {
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<InviteSchema>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "MEMBER",
    },
  });

  const { submitForm, isLoading, actionState } = useFormAction(
    inviteMemberAction,
    form
  );

  useEffect(() => {
    if (actionState?.success) {
      setIsSuccess(true);
      form.reset();
    } else {
      setIsSuccess(false);
    }
  }, [actionState, form]);

  return {
    form,
    onSubmit: submitForm,
    isLoading,
    isSuccess,
    actionState,
  };
}
