"use client";

import * as React from "react";
import { useRegisterForm } from "@/features/auth/register/hooks/useRegisterForm";
import { RegisterFormView } from "@/features/auth/register/ui/RegisterFormView";

export function RegisterForm() {
  return <RegisterFormView {...useRegisterForm()} />;
}
