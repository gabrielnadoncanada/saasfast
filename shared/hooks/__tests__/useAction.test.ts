import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAction } from "../useAction";
import {
  mockActionSuccess,
  mockActionError,
  ActionResponseBuilder,
  createMockFactory,
} from "@/__tests__/setup/test-utils";

// Mock useToastError
const { mockSetServerError, mockClearServerError } = vi.hoisted(() => ({
  mockSetServerError: vi.fn(),
  mockClearServerError: vi.fn(),
}));

vi.mock("../useToastError", () => ({
  useToastError: () => ({
    setServerError: mockSetServerError,
    clearServerError: mockClearServerError,
  }),
}));

// Mock React's useActionState
vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useActionState: vi.fn(),
  };
});

describe("useAction", () => {
  // Utilisation du mock factory pour une gestion automatique
  const mockFactory = createMockFactory();
  const mockFormAction = mockFactory.createMock();
  const mockAction = mockFactory.createMock();

  beforeEach(async () => {
    mockFactory.resetAll(); // Reset automatique de tous les mocks

    // Mock useActionState return values
    const { useActionState } = await import("react");
    vi.mocked(useActionState).mockReturnValue([
      null, // actionState
      mockFormAction, // formAction
      false, // isPending
    ]);
  });

  it("should initialize with correct default values", () => {
    const { result } = renderHook(() => useAction(mockAction));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.actionState).toBe(null);
    expect(typeof result.current.executeAction).toBe("function");
  });

  it("should execute action with form data", () => {
    const { result } = renderHook(() => useAction(mockAction));
    const testData = { name: "test", email: "test@example.com" };

    act(() => {
      result.current.executeAction(testData);
    });

    expect(mockClearServerError).toHaveBeenCalled();
    expect(mockFormAction).toHaveBeenCalledWith(expect.any(FormData));
  });

  it("should handle successful action state", async () => {
    // Utilisation du Builder Pattern pour plus de clarté
    const successState = ActionResponseBuilder.success({
      id: "123",
      name: "Test User",
    }).build();

    const { useActionState } = await import("react");
    vi.mocked(useActionState).mockReturnValue([
      successState,
      mockFormAction,
      false,
    ]);

    const { result } = renderHook(() => useAction(mockAction));

    await waitFor(() => {
      expect(mockClearServerError).toHaveBeenCalled();
    });
  });

  it("should handle error action state", async () => {
    // Utilisation du Builder Pattern pour les erreurs complexes
    const errorState = ActionResponseBuilder.error("Validation failed")
      .withFieldErrors({
        email: ["Email is required"],
        password: ["Password too short"],
      })
      .build();

    const { useActionState } = await import("react");
    vi.mocked(useActionState).mockReturnValue([
      errorState,
      mockFormAction,
      false,
    ]);

    const { result } = renderHook(() => useAction(mockAction));

    await waitFor(() => {
      expect(mockSetServerError).toHaveBeenCalledWith("Validation failed");
    });
  });

  it("should handle loading state", async () => {
    const { useActionState } = await import("react");
    vi.mocked(useActionState).mockReturnValue([
      null,
      mockFormAction,
      true, // isPending = true
    ]);

    const { result } = renderHook(() => useAction(mockAction));

    expect(result.current.isLoading).toBe(true);
  });

  it("should convert data object to FormData correctly", () => {
    const { result } = renderHook(() => useAction(mockAction));
    const testData = {
      name: "John Doe",
      email: "john@example.com",
      age: "30",
    };

    act(() => {
      result.current.executeAction(testData);
    });

    expect(mockFormAction).toHaveBeenCalledWith(expect.any(FormData));

    // Verify FormData content
    const formDataCall = mockFormAction.mock.calls[0][0] as FormData;
    expect(formDataCall.get("name")).toBe("John Doe");
    expect(formDataCall.get("email")).toBe("john@example.com");
    expect(formDataCall.get("age")).toBe("30");
  });
});
