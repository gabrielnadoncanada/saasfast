"use client";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/logout/actions/logout.action";

export function LogoutButton() {
  return <Button onClick={logoutAction}>Logout</Button>;
}
