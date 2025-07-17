"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useRegisterForm } from "@/features/auth/register/hooks/useRegisterForm";
import { RegisterFormView } from "@/features/auth/register/ui/RegisterFormView";

export function RegisterForm() {
  const router = useRouter();
  const { form, onSubmit, serverError } = useRegisterForm();

  const handleSubmit = async (data: Parameters<typeof onSubmit>[0]) => {
    const success = await onSubmit(data);
    if (success) {
      router.push("/register/confirmation");
    }
  };

  return (
    <RegisterFormView
      form={form}
      onSubmit={handleSubmit}
      serverError={serverError}
    />
  );
}
