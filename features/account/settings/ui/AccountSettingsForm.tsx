"use client";

import * as React from "react";
import { useAccountSettingsForm } from "@/features/account/settings/hooks/useAccountSettingsForm";
import { AccountSettingsFormView } from "@/features/account/settings/ui/AccountSettingsFormView";
import type { ProfileRow } from "@/shared/db/drizzle/auth";

interface AccountSettingsFormProps {
  initialData?: ProfileRow | null;
}

export function AccountSettingsForm({ initialData }: AccountSettingsFormProps) {
  return (
    <AccountSettingsFormView {...useAccountSettingsForm({ initialData })} />
  );
}
