import { describe, it, expect, vi, beforeEach } from "vitest";
import { signInWithGoogle } from "@/features/auth/login/actions/googleAuth.action";

// Mock dependencies
vi.mock("@/shared/db/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/shared/lib/redirect", () => ({
  getErrorRedirect: vi.fn((path, key, message) => `${path}?error=${key}`),
}));

describe("signInWithGoogle", () => {
  const mockSupabase = {
    auth: {
      signInWithOAuth: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const { createClient } = await import("@/shared/db/supabase/server");
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  it("should initiate Google OAuth flow", async () => {
    mockSupabase.auth.signInWithOAuth.mockResolvedValue({
      data: { url: "https://accounts.google.com/oauth" },
      error: null,
    });

    await signInWithGoogle();

    expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: expect.stringContaining("/auth/api/callback"),
      },
    });
  });

  it("should handle OAuth errors", async () => {
    const { redirect } = await import("next/navigation");
    const { getErrorRedirect } = await import("@/shared/lib/redirect");

    mockSupabase.auth.signInWithOAuth.mockResolvedValue({
      data: { url: null },
      error: { message: "OAuth error" },
    });

    await signInWithGoogle();

    expect(getErrorRedirect).toHaveBeenCalledWith(
      "/auth",
      "google_auth_error",
      "OAuth error"
    );
    expect(redirect).toHaveBeenCalled();
  });

  it("should redirect to OAuth URL on success", async () => {
    const { redirect } = await import("next/navigation");

    const oauthUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    mockSupabase.auth.signInWithOAuth.mockResolvedValue({
      data: { url: oauthUrl },
      error: null,
    });

    await signInWithGoogle();

    expect(redirect).toHaveBeenCalledWith(oauthUrl);
  });

  it("should use correct callback URL", async () => {
    mockSupabase.auth.signInWithOAuth.mockResolvedValue({
      data: { url: "https://accounts.google.com/oauth" },
      error: null,
    });

    await signInWithGoogle();

    expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          redirectTo: expect.stringMatching(/\/auth\/api\/callback$/),
        }),
      })
    );
  });
});
