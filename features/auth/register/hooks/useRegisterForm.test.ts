import { renderHook, act } from "@testing-library/react";
import { useRegisterForm } from "./useRegisterForm";
import { registerAction } from "@/features/auth/register/actions/register.action";
import { injectFieldErrors } from "@/shared/lib/injectFieldErrors";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/register/actions/register.action", () => ({
  registerAction: vi.fn(),
}));
vi.mock("@/shared/lib/injectFieldErrors", () => ({
  injectFieldErrors: vi.fn(),
}));

describe("useRegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne true et pas d’erreur serveur si registerAction OK", async () => {
    // Arrange
    (registerAction as any).mockResolvedValueOnce({
      success: true,
      data: {
        full_name: "Foo Bar",
        email: "foo@bar.com",
        password: "password",
      },
    });

    const { result } = renderHook(() => useRegisterForm());

    // Act
    let res: any;
    await act(async () => {
      res = await result.current.onSubmit({
        full_name: "Foo Bar",
        email: "foo@bar.com",
        password: "password",
      });
    });

    // Assert
    expect(res).toBe(true);
    expect(injectFieldErrors).not.toHaveBeenCalled();
  });

  it("set l’erreur serveur si registerAction KO", async () => {
    (registerAction as any).mockResolvedValueOnce({
      success: false,
      error: "Cet email existe déjà",
      fieldErrors: { email: ["Cet email existe déjà"] },
    });

    const { result } = renderHook(() => useRegisterForm());

    let res: any;
    await act(async () => {
      res = await result.current.onSubmit({
        full_name: "Foo Bar",
        email: "foo@bar.com",
        password: "password",
      });
    });

    expect(res).toBe(false);
    expect(injectFieldErrors).toHaveBeenCalledWith(result.current.form, {
      email: ["Cet email existe déjà"],
    });
  });

  it("set Erreur inconnue si registerAction retourne erreur mais pas de message", async () => {
    (registerAction as any).mockResolvedValueOnce({
      success: false,
      fieldErrors: { email: ["Obligatoire"] },
    });

    const { result } = renderHook(() => useRegisterForm());

    let res: any;
    await act(async () => {
      res = await result.current.onSubmit({
        full_name: "Foo Bar",
        email: "foo@bar.com",
        password: "password",
      });
    });

    expect(res).toBe(false);
    expect(injectFieldErrors).toHaveBeenCalledWith(result.current.form, {
      email: ["Obligatoire"],
    });
  });
});
