import { describe, it, expect, vi, beforeEach } from "vitest";
import { forgotPasswordAction } from "@/features/auth/forgot-password/actions/forgotPassword.action";

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

describe("forgotPasswordAction", () => {
  const mockSupabase = {
    auth: {
      resetPasswordForEmail: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const { createClient } = await import("@/shared/db/supabase/server");
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  it("should send reset email successfully", async () => {
    const { redirect } = await import("next/navigation");

    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: null,
    });

    const formData = new FormData();
    formData.append("email", "test@example.com");

    await forgotPasswordAction(formData);

    expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "test@example.com",
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/api/reset`,
      }
    );

    expect(redirect).toHaveBeenCalled();
  });

  it("should handle invalid email format", async () => {
    const formData = new FormData();
    formData.append("email", "invalid-email");

    const result = await forgotPasswordAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors).toBeDefined();
    }
    expect(mockSupabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("should show same message for non-existent email", async () => {
    const { redirect } = await import("next/navigation");
    const { getStatusRedirect } = await import("@/shared/lib/redirect");

    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: { message: "User not found" },
    });

    const formData = new FormData();
    formData.append("email", "nonexistent@example.com");

    await forgotPasswordAction(formData);

    // Même avec une erreur, on redirige avec le message générique
    expect(getStatusRedirect).toHaveBeenCalledWith(
      "/auth",
      "Email envoyé.",
      expect.stringContaining("Si cette adresse e-mail existe")
    );
    expect(redirect).toHaveBeenCalled();
  });

  it("should handle supabase errors gracefully", async () => {
    const { redirect } = await import("next/navigation");

    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: { message: "Network error" },
    });

    const formData = new FormData();
    formData.append("email", "test@example.com");

    await forgotPasswordAction(formData);

    // Toujours rediriger avec succès pour éviter l'énumération
    expect(redirect).toHaveBeenCalled();
  });

  it("should redirect with success message", async () => {
    const { redirect } = await import("next/navigation");
    const { getStatusRedirect } = await import("@/shared/lib/redirect");

    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: null,
    });

    const formData = new FormData();
    formData.append("email", "test@example.com");

    await forgotPasswordAction(formData);

    expect(getStatusRedirect).toHaveBeenCalledWith(
      "/auth",
      "Email envoyé.",
      "Si cette adresse e-mail existe, vous recevrez un lien de réinitialisation."
    );
    expect(redirect).toHaveBeenCalled();
  });
});
