import { createClient } from "@/shared/api/supabase/server";
import { cookies } from "next/headers";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <div className="mb-4">
        {user ? (
          <span className="text-green-600">
            Connecté en tant que {user.email}
          </span>
        ) : (
          <span className="text-red-600">Non connecté</span>
        )}
      </div>
      <LogoutButton />
    </div>
  );
}
