"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createTenantAction } from "../actions/createTenant.action";
import { useToastError } from "@/shared/hooks/useToastError";
import { injectFieldErrors } from "@/shared/lib/injectFieldErrors";
import { useUser } from "@/features/auth/shared/ui/UserTenantProvider";

const createTenantSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom du workspace est requis")
    .max(255, "Le nom ne peut pas dépasser 255 caractères"),
});

type CreateTenantSchema = z.infer<typeof createTenantSchema>;

export function useCreateTenantForm() {
  const { serverError, setServerError, clearServerError } = useToastError();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { refreshTenants } = useUser();

  const form = useForm<CreateTenantSchema>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (data: CreateTenantSchema) => {
    clearServerError();
    setIsLoading(true);
    setIsSuccess(false);

    const formData = new FormData();
    formData.append("name", data.name);

    const res = await createTenantAction(formData);
    setIsLoading(false);

    if (!res.success) {
      setServerError(res.error || "Erreur inconnue");
      injectFieldErrors(form, res.fieldErrors);
      return false;
    }

    setIsSuccess(true);
    form.reset();

    // Refresh the tenants data to update the UI immediately
    await refreshTenants();

    return true;
  };

  return {
    form,
    onSubmit,
    isLoading,
    isSuccess,
    serverError,
  };
}
