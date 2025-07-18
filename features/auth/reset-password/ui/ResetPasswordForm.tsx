"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useResetPasswordForm } from "@/features/auth/reset-password/hooks/useResetPasswordForm";
import { ResetPasswordFormView } from "@/features/auth/reset-password/ui/ResetPasswordFormView";

export function ResetPasswordForm() {
  const router = useRouter();
  const { form, onSubmit, serverError, isLoading } = useResetPasswordForm();

  const handleSubmit = async (data: Parameters<typeof onSubmit>[0]) => {
    const success = await onSubmit(data);
    if (success) {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <ResetPasswordFormView
      form={form}
      onSubmit={handleSubmit}
      serverError={serverError}
      isLoading={isLoading}
    />
  );
}
