import { describe, it, expect, vi, beforeEach } from "vitest";
import { resetPasswordAction } from "@/features/auth/reset-password/actions/resetPassword.action";

// Mock dependencies
vi.mock("@/shared/db/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/shared/lib/redirect", () => ({
  getStatusRedirect: vi.fn((path, title, desc) => `${path}?status=success`),
}));

describe("resetPasswordAction", () => {
  const mockSupabase = {
    auth: {
      updateUser: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const { createClient } = await import("@/shared/db/supabase/server");
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  it("should update password successfully", async () => {
    const { redirect } = await import("next/navigation");

    mockSupabase.auth.updateUser.mockResolvedValue({
      data: { user: { id: "123" } },
      error: null,
    });

    const formData = new FormData();
    formData.append("password", "NewSecurePass123!");

    await resetPasswordAction(formData);

    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
      password: "NewSecurePass123!",
    });

    expect(redirect).toHaveBeenCalled();
  });

  it("should handle invalid password format", async () => {
    const formData = new FormData();
    formData.append("password", "weak");

    const result = await resetPasswordAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors).toBeDefined();
    }
    expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("should handle supabase update errors", async () => {
    mockSupabase.auth.updateUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Session expired" },
    });

    const formData = new FormData();
    formData.append("password", "NewSecurePass123!");

    const result = await resetPasswordAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        "Une erreur est survenue lors de la réinitialisation. Veuillez réessayer."
      );
    }
  });

  it("should redirect to dashboard on success", async () => {
    const { redirect } = await import("next/navigation");
    const { getStatusRedirect } = await import("@/shared/lib/redirect");

    mockSupabase.auth.updateUser.mockResolvedValue({
      data: { user: { id: "123" } },
      error: null,
    });

    const formData = new FormData();
    formData.append("password", "NewSecurePass123!");

    await resetPasswordAction(formData);

    expect(getStatusRedirect).toHaveBeenCalledWith(
      "/dashboard",
      "Mot de passe réinitialisé.",
      expect.stringContaining("connecté avec votre nouveau mot de passe")
    );
    expect(redirect).toHaveBeenCalled();
  });
});
