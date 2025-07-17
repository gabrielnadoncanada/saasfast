"use client";

import { createClient } from "@/shared/api/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LOGIN_PATH } from "@/shared/constants/routes";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = await createClient();
    await supabase.auth.signOut();
    router.push(LOGIN_PATH);
  };

  return <Button onClick={logout}>Logout</Button>;
}
