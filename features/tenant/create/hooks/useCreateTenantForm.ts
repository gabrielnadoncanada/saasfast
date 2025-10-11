"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createTenantAction } from "../actions/createTenant.action";
import { useFormAction } from "@/shared/hooks/useFormAction";
import { useUser } from "@/features/auth/shared/ui/UserTenantProvider";

const createTenantSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom du workspace est requis")
    .max(255, "Le nom ne peut pas dépasser 255 caractères"),
});

type CreateTenantSchema = z.infer<typeof createTenantSchema>;

export function useCreateTenantForm() {
  const [isSuccess, setIsSuccess] = useState(false);
  const { refreshTenants } = useUser();

  const form = useForm<CreateTenantSchema>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: "",
    },
  });

  const { submitForm, isLoading, actionState } = useFormAction(
    createTenantAction,
    form
  );

  useEffect(() => {
    if (actionState?.success) {
      setIsSuccess(true);
      form.reset();
      refreshTenants();
    } else {
      setIsSuccess(false);
    }
  }, [actionState, form, refreshTenants]);

  return {
    form,
    onSubmit: submitForm,
    isLoading,
    isSuccess,
    actionState,
  };
}
