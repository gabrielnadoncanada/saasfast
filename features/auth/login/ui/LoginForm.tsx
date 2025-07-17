"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLoginForm } from "@/features/auth/login/hooks/useLoginForm";
import { LoginFormView } from "@/features/auth/login/ui/LoginFormView";

export function LoginForm() {
  const router = useRouter();
  const { form, onSubmit, serverError, isLoading } = useLoginForm();

  const handleSubmit = async (data: Parameters<typeof onSubmit>[0]) => {
    const success = await onSubmit(data);
    if (success) {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <LoginFormView
      form={form}
      onSubmit={handleSubmit}
      serverError={serverError}
      isLoading={isLoading}
    />
  );
}
