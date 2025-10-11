import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFormActionWithFiles } from "@/shared/hooks/useFormActionWithFiles";
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

describe("useFormActionWithFiles", () => {
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
    const { result } = renderHook(() =>
      useFormActionWithFiles(mockAction, mockForm)
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.actionState).toBe(null);
    expect(typeof result.current.submitFormWithFiles).toBe("function");
  });

  it("should submit form with data only", () => {
    const { result } = renderHook(() =>
      useFormActionWithFiles(mockAction, mockForm)
    );
    const testData = { name: "test", email: "test@example.com" };

    act(() => {
      result.current.submitFormWithFiles(testData);
    });

    expect(mockClearServerError).toHaveBeenCalled();
    expect(mockFormAction).toHaveBeenCalledWith(expect.any(FormData));

    const formDataCall = mockFormAction.mock.calls[0][0] as FormData;
    expect(formDataCall.get("name")).toBe("test");
    expect(formDataCall.get("email")).toBe("test@example.com");
  });

  it("should submit form with data and files", () => {
    const { result } = renderHook(() =>
      useFormActionWithFiles(mockAction, mockForm)
    );
    const testData = { name: "test", email: "test@example.com" };
    const mockFile = new File(["test content"], "test.txt", {
      type: "text/plain",
    });
    const files = { avatar: mockFile };

    act(() => {
      result.current.submitFormWithFiles(testData, files);
    });

    expect(mockClearServerError).toHaveBeenCalled();
    expect(mockFormAction).toHaveBeenCalledWith(expect.any(FormData));

    const formDataCall = mockFormAction.mock.calls[0][0] as FormData;
    expect(formDataCall.get("name")).toBe("test");
    expect(formDataCall.get("email")).toBe("test@example.com");
    expect(formDataCall.get("avatar")).toBe(mockFile);
  });

  it("should handle multiple files", () => {
    const { result } = renderHook(() =>
      useFormActionWithFiles(mockAction, mockForm)
    );
    const testData = { name: "test" };
    const mockFile1 = new File(["content1"], "file1.txt", {
      type: "text/plain",
    });
    const mockFile2 = new File(["content2"], "file2.jpg", {
      type: "image/jpeg",
    });
    const files = {
      document: mockFile1,
      image: mockFile2,
    };

    act(() => {
      result.current.submitFormWithFiles(testData, files);
    });

    const formDataCall = mockFormAction.mock.calls[0][0] as FormData;
    expect(formDataCall.get("name")).toBe("test");
    expect(formDataCall.get("document")).toBe(mockFile1);
    expect(formDataCall.get("image")).toBe(mockFile2);
  });

  it("should handle successful submission", async () => {
    const successState = mockActionSuccess({ id: "123" });

    const { useActionState } = await import("react");
    vi.mocked(useActionState).mockReturnValue([
      successState,
      mockFormAction,
      false,
    ]);

    const { result } = renderHook(() =>
      useFormActionWithFiles(mockAction, mockForm)
    );

    await waitFor(() => {
      expect(mockClearServerError).toHaveBeenCalled();
    });
  });

  it("should handle submission errors with field errors", async () => {
    const errorState = mockActionError("Upload failed", {
      avatar: ["File too large"],
      name: ["Name is required"],
    });

    const { useActionState } = await import("react");
    vi.mocked(useActionState).mockReturnValue([
      errorState,
      mockFormAction,
      false,
    ]);

    const { result } = renderHook(() =>
      useFormActionWithFiles(mockAction, mockForm)
    );

    await waitFor(() => {
      expect(mockSetServerError).toHaveBeenCalledWith("Upload failed");
      expect(mockInjectFieldErrors).toHaveBeenCalledWith(mockForm, {
        avatar: ["File too large"],
        name: ["Name is required"],
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

    const { result } = renderHook(() =>
      useFormActionWithFiles(mockAction, mockForm)
    );

    expect(result.current.isLoading).toBe(true);
  });

  it("should filter out undefined and null values from data", () => {
    const { result } = renderHook(() =>
      useFormActionWithFiles(mockAction, mockForm)
    );
    const testData = {
      name: "John",
      email: undefined,
      age: null,
      city: "Paris",
    };
    const mockFile = new File(["test"], "test.txt", { type: "text/plain" });
    const files = { document: mockFile };

    act(() => {
      result.current.submitFormWithFiles(testData, files);
    });

    const formDataCall = mockFormAction.mock.calls[0][0] as FormData;
    expect(formDataCall.get("name")).toBe("John");
    expect(formDataCall.get("city")).toBe("Paris");
    expect(formDataCall.get("document")).toBe(mockFile);
    expect(formDataCall.has("email")).toBe(false);
    expect(formDataCall.has("age")).toBe(false);
  });

  it("should work without files parameter", () => {
    const { result } = renderHook(() =>
      useFormActionWithFiles(mockAction, mockForm)
    );
    const testData = { name: "test", email: "test@example.com" };

    act(() => {
      result.current.submitFormWithFiles(testData, undefined);
    });

    expect(mockFormAction).toHaveBeenCalledWith(expect.any(FormData));

    const formDataCall = mockFormAction.mock.calls[0][0] as FormData;
    expect(formDataCall.get("name")).toBe("test");
    expect(formDataCall.get("email")).toBe("test@example.com");
  });
});
