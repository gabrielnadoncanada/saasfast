import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { useFormAction } from "@/shared/hooks/useFormAction";
import {
  mockActionSuccess,
  mockActionError,
  mockFormState,
} from "@/__tests__/setup/test-utils";

// Mock dependencies
const { mockSetServerError, mockClearServerError, mockInjectFieldErrors } =
  vi.hoisted(() => ({
    mockSetServerError: vi.fn(),
    mockClearServerError: vi.fn(),
    mockInjectFieldErrors: vi.fn(),
  }));

vi.mock("@/shared/hooks/useToastError", () => ({
  useToastError: () => ({
    setServerError: mockSetServerError,
    clearServerError: mockClearServerError,
  }),
}));

vi.mock("@/shared/lib/injectFieldErrors", () => ({
  injectFieldErrors: mockInjectFieldErrors,
}));

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useActionState: vi.fn(),
  };
});

describe("useFormAction", () => {
  const mockFormAction = vi.fn();
  const mockAction = vi.fn();
  const mockForm = {
    ...mockFormState,
    handleSubmit: vi.fn(),
    setError: vi.fn(),
    clearErrors: vi.fn(),
  } as any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock useActionState
    const { useActionState } = await import("react");
    vi.mocked(useActionState).mockReturnValue([null, mockFormAction, false]);
  });

  it("should initialize with correct default values", () => {
    const { result } = renderHook(() => useFormAction(mockAction, mockForm));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.actionState).toBe(null);
    expect(typeof result.current.submitForm).toBe("function");
  });

  it("should submit form with data", () => {
    const { result } = renderHook(() => useFormAction(mockAction, mockForm));
    const testData = { name: "test", email: "test@example.com" };

    act(() => {
      result.current.submitForm(testData);
    });

    expect(mockClearServerError).toHaveBeenCalled();
    expect(mockFormAction).toHaveBeenCalledWith(expect.any(FormData));
  });

  it("should handle successful form submission", async () => {
    const successState = mockActionSuccess({ id: "123" });

    const { useActionState } = await import("react");
    vi.mocked(useActionState).mockReturnValue([
      successState,
      mockFormAction,
      false,
    ]);

    const { result } = renderHook(() => useFormAction(mockAction, mockForm));

    await waitFor(() => {
      expect(mockClearServerError).toHaveBeenCalled();
    });
  });

  it("should handle form submission errors", async () => {
    const errorState = mockActionError("Validation failed", {
      email: ["Email is required"],
      name: ["Name is too short"],
    });

    const { useActionState } = await import("react");
    vi.mocked(useActionState).mockReturnValue([
      errorState,
      mockFormAction,
      false,
    ]);

    const { result } = renderHook(() => useFormAction(mockAction, mockForm));

    await waitFor(() => {
      expect(mockSetServerError).toHaveBeenCalledWith("Validation failed");
      expect(mockInjectFieldErrors).toHaveBeenCalledWith(mockForm, {
        email: ["Email is required"],
        name: ["Name is too short"],
      });
    });
  });

  it("should handle loading state", async () => {
    const { useActionState } = await import("react");
    vi.mocked(useActionState).mockReturnValue([
      null,
      mockFormAction,
      true, // isPending = true
    ]);

    const { result } = renderHook(() => useFormAction(mockAction, mockForm));

    expect(result.current.isLoading).toBe(true);
  });

  it("should filter out undefined and null values", () => {
    const { result } = renderHook(() => useFormAction(mockAction, mockForm));
    const testData = {
      name: "John",
      email: "john@example.com",
      age: undefined,
      city: null,
      country: "France",
    };

    act(() => {
      result.current.submitForm(testData);
    });

    const formDataCall = mockFormAction.mock.calls[0][0] as FormData;
    expect(formDataCall.get("name")).toBe("John");
    expect(formDataCall.get("email")).toBe("john@example.com");
    expect(formDataCall.get("country")).toBe("France");
    expect(formDataCall.has("age")).toBe(false);
    expect(formDataCall.has("city")).toBe(false);
  });

  it("should convert values to string", () => {
    const { result } = renderHook(() => useFormAction(mockAction, mockForm));
    const testData = {
      name: "John",
      age: 30,
      isActive: true,
      score: 95.5,
    };

    act(() => {
      result.current.submitForm(testData);
    });

    const formDataCall = mockFormAction.mock.calls[0][0] as FormData;
    expect(formDataCall.get("name")).toBe("John");
    expect(formDataCall.get("age")).toBe("30");
    expect(formDataCall.get("isActive")).toBe("true");
    expect(formDataCall.get("score")).toBe("95.5");
  });
});
