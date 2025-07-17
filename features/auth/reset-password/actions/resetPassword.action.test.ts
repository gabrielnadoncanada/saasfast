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

import { createClient } from "@/shared/api/supabase/server";

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

  it("retourne une erreur si l'auth Supabase échoue", async () => {
    (createClient as any).mockReturnValue({
      auth: {
        updateUser: vi
          .fn()
          .mockResolvedValue({ error: { message: "Password too weak" } }),
      },
    });

    const result = await resetPasswordAction(
      createResetPasswordForm("weakpassword")
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/Password too weak/i);
    }
  });

  it("retourne un succès et les données si reset password OK", async () => {
    (createClient as any).mockReturnValue({
      auth: {
        updateUser: vi.fn().mockResolvedValue({ error: null }),
      },
    });

    const result = await resetPasswordAction(
      createResetPasswordForm("strongpassword123")
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        password: "strongpassword123",
      });
    }
  });

  it("appelle updateUser avec les bons paramètres", async () => {
    const mockUpdateUser = vi.fn().mockResolvedValue({ error: null });
    (createClient as any).mockReturnValue({
      auth: {
        updateUser: mockUpdateUser,
      },
    });

    await resetPasswordAction(createResetPasswordForm("strongpassword123"));

    expect(mockUpdateUser).toHaveBeenCalledWith({
      password: "strongpassword123",
    });
  });
});