"use client";

import * as React from "react";
import { useResetPasswordForm } from "@/features/auth/reset-password/hooks/useResetPasswordForm";
import { ResetPasswordFormView } from "@/features/auth/reset-password/ui/ResetPasswordFormView";

export function ResetPasswordForm() {
  return <ResetPasswordFormView {...useResetPasswordForm()} />;
}
