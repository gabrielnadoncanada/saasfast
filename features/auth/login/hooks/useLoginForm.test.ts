import { renderHook, act } from "@testing-library/react";
import { useLoginForm } from "./useLoginForm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loginAction } from "@/features/auth/login/actions/login.action";

vi.mock("@/features/auth/login/actions/login.action", () => ({
  loginAction: vi.fn(),
}));

describe("useLoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne false quand login échoue", async () => {
    (loginAction as any).mockResolvedValue({
      success: false,
      error: "Invalid credentials",
      fieldErrors: { email: ["Email incorrect"] },
    });

    const { result } = renderHook(() => useLoginForm());

    await act(async () => {
      const ok = await result.current.onSubmit({
        email: "wrong@mail.com",
        password: "wrongpassword",
      });
      expect(ok).toBe(false);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("retourne true et pas d'erreur si login OK", async () => {
    (loginAction as any).mockResolvedValue({
      success: true,
      data: { email: "user@mail.com", password: "goodpassword" },
    });

    const { result } = renderHook(() => useLoginForm());

    await act(async () => {
      const ok = await result.current.onSubmit({
        email: "user@mail.com",
        password: "goodpassword",
      });
      expect(ok).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("isLoading est bien false avant et après le submit", async () => {
    (loginAction as any).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return {
        success: true,
        data: { email: "user@mail.com", password: "goodpassword" },
      };
    });

    const { result } = renderHook(() => useLoginForm());

    expect(result.current.isLoading).toBe(false);

    await act(async () => {
      await result.current.onSubmit({
        email: "user@mail.com",
        password: "goodpassword",
      });
    });

    expect(result.current.isLoading).toBe(false);
  });
});
