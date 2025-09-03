import { describe, it, expect, vi, beforeEach } from "vitest";
import { loginAction } from "./login.action";

function createLoginForm(email: string, password: string) {
  const form = new FormData();
  form.append("email", email);
  form.append("password", password);
  return form;
}

vi.mock("@/shared/api/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
    },
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { createClient } from "@/shared/db/supabase/server";
import { redirect } from "next/navigation";

describe("loginAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne une erreur si la validation échoue", async () => {
    const result = await loginAction(createLoginForm("", ""));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/validation/i);
    }
  });

  it("retourne une erreur si l'auth Supabase échoue", async () => {
    (createClient as any).mockReturnValue({
      auth: {
        signInWithPassword: vi
          .fn()
          .mockResolvedValue({ error: { message: "Mauvais identifiants" } }),
      },
    });

    const result = await loginAction(
      createLoginForm("fail@mail.com", "wrong123")
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/Email ou mot de passe incorrect/i);
    }
  });

  it("redirects to dashboard when login succeeds", async () => {
    (createClient as any).mockReturnValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      },
    });

    await loginAction(createLoginForm("user@mail.com", "goodpassword"));

    expect(redirect).toHaveBeenCalledWith(
      expect.stringContaining("/dashboard")
    );
  });
});
