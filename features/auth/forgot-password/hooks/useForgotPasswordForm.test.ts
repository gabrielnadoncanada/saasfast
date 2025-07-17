import { renderHook, act } from "@testing-library/react";
import { useForgotPasswordForm } from "./useForgotPasswordForm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { forgotPasswordAction } from "@/features/auth/forgot-password/actions/forgotPassword.action";

vi.mock("@/features/auth/forgot-password/actions/forgotPassword.action", () => ({
  forgotPasswordAction: vi.fn(),
}));

describe("useForgotPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne une erreur serveur et la place dans serverError", async () => {
    (forgotPasswordAction as any).mockResolvedValue({
      success: false,
      error: "Email not found",
      fieldErrors: { email: ["Email invalide"] },
    });

    const { result } = renderHook(() => useForgotPasswordForm());

    await act(async () => {
      const ok = await result.current.onSubmit({
        email: "notfound@mail.com",
      });
      expect(ok).toBe(false);
    });

    expect(result.current.serverError).toBe("Email not found");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
  });

  it("retourne true et met isSuccess à true si forgot password OK", async () => {
    (forgotPasswordAction as any).mockResolvedValue({
      success: true,
      data: { email: "user@mail.com" },
    });

    const { result } = renderHook(() => useForgotPasswordForm());

    await act(async () => {
      const ok = await result.current.onSubmit({
        email: "user@mail.com",
      });
      expect(ok).toBe(true);
    });

    expect(result.current.serverError).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(true);
  });

  it("isLoading est bien false avant et après le submit", async () => {
    (forgotPasswordAction as any).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return {
        success: true,
        data: { email: "user@mail.com" },
      };
    });

    const { result } = renderHook(() => useForgotPasswordForm());

    expect(result.current.isLoading).toBe(false);

    await act(async () => {
      await result.current.onSubmit({
        email: "user@mail.com",
      });
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("reset serverError à null au début de onSubmit", async () => {
    (forgotPasswordAction as any).mockResolvedValue({
      success: true,
      data: { email: "user@mail.com" },
    });

    const { result } = renderHook(() => useForgotPasswordForm());

    // Simuler une erreur précédente
    await act(async () => {
      result.current.onSubmit({ email: "invalid" });
    });

    // Maintenant faire un submit réussi
    await act(async () => {
      await result.current.onSubmit({
        email: "user@mail.com",
      });
    });

    expect(result.current.serverError).toBeNull();
  });
});