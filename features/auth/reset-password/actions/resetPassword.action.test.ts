import { describe, it, expect, vi, beforeEach } from "vitest";
import { resetPasswordAction } from "./resetPassword.action";

function createResetPasswordForm(password: string) {
  const form = new FormData();
  form.append("password", password);
  return form;
}

vi.mock("@/shared/api/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      updateUser: vi.fn(),
    },
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { createClient } from "@/shared/db/supabase/server";
import { redirect } from "next/navigation";

describe("resetPasswordAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne une erreur si la validation échoue", async () => {
    const result = await resetPasswordAction(createResetPasswordForm(""));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/validation/i);
    }
  });

  it("retourne une erreur si le mot de passe est trop court", async () => {
    const result = await resetPasswordAction(createResetPasswordForm("123"));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/validation/i);
    }
  });

  it("returns error when Supabase fails", async () => {
    (createClient as any).mockReturnValue({
      auth: {
        updateUser: vi
          .fn()
          .mockResolvedValue({ error: { message: "Password too weak" } }),
      },
    });

    const result = await resetPasswordAction(
      createResetPasswordForm("StrongPassword123!")
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/Une erreur est survenue/i);
    }
  });

  it("redirects to dashboard when password reset succeeds", async () => {
    (createClient as any).mockReturnValue({
      auth: {
        updateUser: vi.fn().mockResolvedValue({ error: null }),
      },
    });

    await resetPasswordAction(createResetPasswordForm("StrongPassword123!"));

    expect(redirect).toHaveBeenCalledWith(
      expect.stringContaining("/dashboard")
    );
  });

  it("calls updateUser with correct parameters", async () => {
    const mockUpdateUser = vi.fn().mockResolvedValue({ error: null });
    (createClient as any).mockReturnValue({
      auth: {
        updateUser: mockUpdateUser,
      },
    });

    await resetPasswordAction(createResetPasswordForm("StrongPassword123!"));

    expect(mockUpdateUser).toHaveBeenCalledWith({
      password: "StrongPassword123!",
    });
  });
});
