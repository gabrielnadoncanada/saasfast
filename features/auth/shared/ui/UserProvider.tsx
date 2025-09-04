"use client";

import { AUTH_PATH } from "@/shared/constants/routes";
import { createClient } from "@/shared/db/supabase/client";
import { getStatusRedirect } from "@/shared/lib/redirect";
import { redirect, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type UserWithProfile = { authUser: any | null; profile: any | null };
type Ctx = { user: UserWithProfile | null; logout: () => Promise<void> };

const UserContext = createContext<Ctx | undefined>(undefined);

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect(
    getStatusRedirect(
      AUTH_PATH,
      "Déconnexion réussie.",
      "Vous êtes maintenant déconnecté."
    )
  );
}

export function UserProvider({
  initial,
  children,
}: {
  initial: UserWithProfile | null;
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState<UserWithProfile | null>(initial ?? null);

  useEffect(() => {
    setUser(initial ?? null);
  }, [initial]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "INITIAL_SESSION") return;
        setUser((prev) => ({
          authUser: session?.user ?? null,
          profile: prev?.profile ?? null,
        }));
        router.refresh();
      }
    );
    return () => sub.subscription.unsubscribe();
  }, [supabase, router]);

  const value = useMemo<Ctx>(() => ({ user, logout }), [user]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
}
