"use client";

import * as React from "react";
import { useLoginForm } from "@/features/auth/login/hooks/useLoginForm";
import { LoginFormView } from "@/features/auth/login/ui/LoginFormView";

export function LoginForm() {
  return <LoginFormView {...useLoginForm()} />;
}
