import { renderHook, act } from "@testing-library/react";
import { useResetPasswordForm } from "./useResetPasswordForm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetPasswordAction } from "@/features/auth/reset-password/actions/resetPassword.action";

vi.mock("@/features/auth/reset-password/actions/resetPassword.action", () => ({
  resetPasswordAction: vi.fn(),
}));

describe("useResetPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne une erreur serveur et la place dans serverError", async () => {
    (resetPasswordAction as any).mockResolvedValue({
      success: false,
      error: "Password too weak",
      fieldErrors: { password: ["Mot de passe trop faible"] },
    });

    const { result } = renderHook(() => useResetPasswordForm());

    await act(async () => {
      const ok = await result.current.onSubmit({
        password: "weak",
      });
      expect(ok).toBe(false);
    });

    expect(result.current.serverError).toBe("Password too weak");
    expect(result.current.isLoading).toBe(false);
  });

  it("retourne true et pas d'erreur si reset password OK", async () => {
    (resetPasswordAction as any).mockResolvedValue({
      success: true,
      data: { password: "strongpassword123" },
    });

    const { result } = renderHook(() => useResetPasswordForm());

    await act(async () => {
      const ok = await result.current.onSubmit({
        password: "strongpassword123",
      });
      expect(ok).toBe(true);
    });

    expect(result.current.serverError).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("isLoading est bien false avant et après le submit", async () => {
    (resetPasswordAction as any).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return {
        success: true,
        data: { password: "strongpassword123" },
      };
    });

    const { result } = renderHook(() => useResetPasswordForm());

    expect(result.current.isLoading).toBe(false);

    await act(async () => {
      await result.current.onSubmit({
        password: "strongpassword123",
      });
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("reset serverError à null au début de onSubmit", async () => {
    (resetPasswordAction as any).mockResolvedValue({
      success: true,
      data: { password: "strongpassword123" },
    });

    const { result } = renderHook(() => useResetPasswordForm());

    // Simuler une erreur précédente
    await act(async () => {
      result.current.onSubmit({ password: "weak" });
    });

    // Maintenant faire un submit réussi
    await act(async () => {
      await result.current.onSubmit({
        password: "strongpassword123",
      });
    });

    expect(result.current.serverError).toBeNull();
  });
});