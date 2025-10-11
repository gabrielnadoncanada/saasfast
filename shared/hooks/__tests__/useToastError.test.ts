import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToastError } from "../useToastError";

// Mock the toast hook
const mockToast = vi.fn();
vi.mock("@/components/ui/Toasts/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

describe("useToastError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with null server error", () => {
    const { result } = renderHook(() => useToastError());

    expect(result.current.serverError).toBe(null);
    expect(typeof result.current.setServerError).toBe("function");
    expect(typeof result.current.clearServerError).toBe("function");
  });

  it("should set server error and show toast", () => {
    const { result } = renderHook(() => useToastError());
    const errorMessage = "Something went wrong";

    act(() => {
      result.current.setServerError(errorMessage);
    });

    expect(result.current.serverError).toBe(errorMessage);
    expect(mockToast).toHaveBeenCalledWith({
      title: "Erreur",
      description: errorMessage,
      variant: "destructive",
    });
  });

  it("should clear server error", () => {
    const { result } = renderHook(() => useToastError());

    // First set an error
    act(() => {
      result.current.setServerError("Test error");
    });

    expect(result.current.serverError).toBe("Test error");

    // Then clear it
    act(() => {
      result.current.clearServerError();
    });

    expect(result.current.serverError).toBe(null);
  });

  it("should not show toast when setting null error", () => {
    const { result } = renderHook(() => useToastError());

    act(() => {
      result.current.setServerError(null);
    });

    expect(result.current.serverError).toBe(null);
    expect(mockToast).not.toHaveBeenCalled();
  });

  it("should update server error state when setting new error", () => {
    const { result } = renderHook(() => useToastError());

    // Set first error
    act(() => {
      result.current.setServerError("First error");
    });

    expect(result.current.serverError).toBe("First error");
    expect(mockToast).toHaveBeenCalledWith({
      title: "Erreur",
      description: "First error",
      variant: "destructive",
    });

    // Set second error
    act(() => {
      result.current.setServerError("Second error");
    });

    expect(result.current.serverError).toBe("Second error");
    expect(mockToast).toHaveBeenCalledWith({
      title: "Erreur",
      description: "Second error",
      variant: "destructive",
    });

    expect(mockToast).toHaveBeenCalledTimes(2);
  });

  it("should handle empty string as error but not show toast", () => {
    const { result } = renderHook(() => useToastError());

    act(() => {
      result.current.setServerError("");
    });

    expect(result.current.serverError).toBe("");
    // Empty string is falsy, so no toast should be shown
    expect(mockToast).not.toHaveBeenCalled();
  });
});
