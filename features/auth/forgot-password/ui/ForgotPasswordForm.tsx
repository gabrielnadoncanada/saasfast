"use client";

import * as React from "react";
import { useForgotPasswordForm } from "@/features/auth/forgot-password/hooks/useForgotPasswordForm";
import { ForgotPasswordFormView } from "@/features/auth/forgot-password/ui/ForgotPasswordFormView";

export function ForgotPasswordForm() {
  return <ForgotPasswordFormView {...useForgotPasswordForm()} />;
}
