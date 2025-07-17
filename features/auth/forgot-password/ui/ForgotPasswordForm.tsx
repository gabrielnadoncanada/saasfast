"use client";

import * as React from "react";
import { useForgotPasswordForm } from "@/features/auth/forgot-password/hooks/useForgotPasswordForm";
import { ForgotPasswordFormView } from "@/features/auth/forgot-password/ui/ForgotPasswordFormView";

export function ForgotPasswordForm() {
  const { form, onSubmit, serverError, isLoading, isSuccess } = useForgotPasswordForm();

  return (
    <ForgotPasswordFormView
      form={form}
      onSubmit={onSubmit}
      serverError={serverError}
      isLoading={isLoading}
      isSuccess={isSuccess}
    />
  );
}