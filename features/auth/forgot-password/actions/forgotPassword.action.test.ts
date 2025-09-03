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

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { createClient } from "@/shared/db/supabase/server";
import { redirect } from "next/navigation";

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
    const result = await forgotPasswordAction(
      createForgotPasswordForm("invalid-email")
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/validation/i);
    }
  });

  it("redirects with error message when Supabase fails", async () => {
    (createClient as any).mockReturnValue({
      auth: {
        resetPasswordForEmail: vi
          .fn()
          .mockResolvedValue({ error: { message: "Email not found" } }),
      },
    });

    await forgotPasswordAction(createForgotPasswordForm("notfound@mail.com"));

    expect(redirect).toHaveBeenCalledWith(expect.stringContaining("/auth"));
  });

  it("redirects with success message when email is sent", async () => {
    (createClient as any).mockReturnValue({
      auth: {
        resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      },
    });

    await forgotPasswordAction(createForgotPasswordForm("user@mail.com"));

    expect(redirect).toHaveBeenCalledWith(expect.stringContaining("/auth"));
  });

  it("calls resetPasswordForEmail with correct parameters", async () => {
    const mockResetPasswordForEmail = vi
      .fn()
      .mockResolvedValue({ error: null });
    (createClient as any).mockReturnValue({
      auth: {
        resetPasswordForEmail: mockResetPasswordForEmail,
      },
    });

    await forgotPasswordAction(createForgotPasswordForm("user@mail.com"));

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith("user@mail.com", {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/api/reset`,
    });
  });
});
