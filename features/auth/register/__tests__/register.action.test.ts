import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerAction } from "@/features/auth/register/actions/register.action";
import { mockActionSuccess, mockActionError } from "@/__tests__/setup/test-utils";

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

describe("registerAction", () => {
  const mockSupabase = {
    auth: {
      signUp: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const { createClient } = await import("@/shared/db/supabase/server");
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  it("should create account successfully", async () => {
    const { redirect } = await import("next/navigation");

    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: "123", email: "test@example.com" } },
      error: null,
    });

    const formData = new FormData();
    formData.append("email", "test@example.com");
    formData.append("password", "SecurePass123!");
    formData.append("full_name", "Test User");

    await registerAction(formData);

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "SecurePass123!",
      options: {
        data: { full_name: "Test User" },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/api/confirm`,
      },
    });

    expect(redirect).toHaveBeenCalled();
  });

  it("should handle invalid form data", async () => {
    const formData = new FormData();
    formData.append("email", "invalid-email");
    formData.append("password", "weak");
    formData.append("full_name", "");

    const result = await registerAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors).toBeDefined();
    }
    expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("should handle duplicate email error", async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null },
      error: { message: "User already registered" },
    });

    const formData = new FormData();
    formData.append("email", "existing@example.com");
    formData.append("password", "SecurePass123!");
    formData.append("full_name", "Test User");

    const result = await registerAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Cette adresse e-mail est déjà utilisée.");
    }
  });

  it("should handle supabase auth errors", async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null },
      error: { message: "Database connection failed" },
    });

    const formData = new FormData();
    formData.append("email", "test@example.com");
    formData.append("password", "SecurePass123!");
    formData.append("full_name", "Test User");

    const result = await registerAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        "Une erreur est survenue lors de la création du compte. Veuillez réessayer."
      );
    }
  });

  it("should redirect with success message", async () => {
    const { redirect } = await import("next/navigation");
    const { getStatusRedirect } = await import("@/shared/lib/redirect");

    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: "123" } },
      error: null,
    });

    const formData = new FormData();
    formData.append("email", "test@example.com");
    formData.append("password", "SecurePass123!");
    formData.append("full_name", "Test User");

    await registerAction(formData);

    expect(getStatusRedirect).toHaveBeenCalledWith(
      "/auth",
      "Votre compte a été créé !",
      "Vérifiez votre e-mail pour confirmer votre inscription. Connectez-vous dès que vous avez validé votre adresse."
    );
    expect(redirect).toHaveBeenCalled();
  });

  it("should include full_name in user metadata", async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: "123" } },
      error: null,
    });

    const formData = new FormData();
    formData.append("email", "test@example.com");
    formData.append("password", "SecurePass123!");
    formData.append("full_name", "John Doe");

    await registerAction(formData);

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          data: { full_name: "John Doe" },
        }),
      })
    );
  });
});
