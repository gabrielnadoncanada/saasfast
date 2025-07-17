import { describe, it, expect, vi, beforeEach } from "vitest";
import { forgotPasswordAction } from "./forgotPassword.action";

function createForgotPasswordForm(email: string) {
  const form = new FormData();
  form.append("email", email);
  return form;
}

vi.mock("@/shared/api/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      resetPasswordForEmail: vi.fn(),
    },
  })),
}));

import { createClient } from "@/shared/api/supabase/server";

describe("forgotPasswordAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne une erreur si la validation échoue", async () => {
    const result = await forgotPasswordAction(createForgotPasswordForm(""));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/validation/i);
    }
  });

  it("retourne une erreur si l'email est invalide", async () => {
    const result = await forgotPasswordAction(createForgotPasswordForm("invalid-email"));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/validation/i);
    }
  });

  it("retourne une erreur si l'auth Supabase échoue", async () => {
    (createClient as any).mockReturnValue({
      auth: {
        resetPasswordForEmail: vi
          .fn()
          .mockResolvedValue({ error: { message: "Email not found" } }),
      },
    });

    const result = await forgotPasswordAction(
      createForgotPasswordForm("notfound@mail.com")
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/Email not found/i);
    }
  });

  it("retourne un succès et les données si forgot password OK", async () => {
    (createClient as any).mockReturnValue({
      auth: {
        resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      },
    });

    const result = await forgotPasswordAction(
      createForgotPasswordForm("user@mail.com")
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        email: "user@mail.com",
      });
    }
  });

  it("appelle resetPasswordForEmail avec les bons paramètres", async () => {
    const mockResetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });
    (createClient as any).mockReturnValue({
      auth: {
        resetPasswordForEmail: mockResetPasswordForEmail,
      },
    });

    await forgotPasswordAction(createForgotPasswordForm("user@mail.com"));

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith("user@mail.com", {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    });
  });
});