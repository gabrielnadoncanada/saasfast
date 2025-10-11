import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLoginForm } from "@/features/auth/login/hooks/useLoginForm";
import {
  mockActionSuccess,
  mockActionError,
} from "@/__tests__/setup/test-utils";

// Mock dependencies
vi.mock("@/shared/hooks/useFormAction.ts", () => ({
  useFormAction: vi.fn(),
}));

vi.mock("@/features/auth/login/actions/login.action.ts", () => ({
  loginAction: vi.fn(),
}));

vi.mock("@/features/auth/shared/schema/auth.schema.ts", () => ({
  loginSchema: {
    parse: vi.fn(),
    safeParse: vi.fn(),
  },
}));

vi.mock("react-hook-form", () => ({
  useForm: vi.fn(),
}));

vi.mock("@hookform/resolvers/zod", () => ({
  zodResolver: vi.fn(),
}));

describe("useLoginForm", () => {
  const mockForm = {
    handleSubmit: vi.fn(),
    formState: {
      errors: {},
      isSubmitting: false,
      isValid: true,
    },
    register: vi.fn(),
    setValue: vi.fn(),
    getValues: vi.fn(),
    reset: vi.fn(),
  };

  const mockSubmitForm = vi.fn();
  const mockUseFormAction = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock useForm
    const { useForm } = await import("react-hook-form");
    vi.mocked(useForm).mockReturnValue(mockForm as any);

    // Mock useFormAction
    const { useFormAction } = await import("@/shared/hooks/useFormAction");
    mockUseFormAction.mockReturnValue({
      submitForm: mockSubmitForm,
      isLoading: false,
      actionState: null,
    });
    vi.mocked(useFormAction).mockImplementation(mockUseFormAction);
  });

  it("should initialize form with correct default values", () => {
    const { result } = renderHook(() => useLoginForm());

    expect(result.current.form).toBe(mockForm);
    expect(result.current.onSubmit).toBe(mockSubmitForm);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.actionState).toBe(null);
  });

  it("should configure form with zodResolver and loginSchema", async () => {
    const { useForm } = await import("react-hook-form");
    const { zodResolver } = await import("@hookform/resolvers/zod");
    const { loginSchema } = await import(
      "@/features/auth/shared/schema/auth.schema"
    );

    renderHook(() => useLoginForm());

    expect(useForm).toHaveBeenCalledWith({
      resolver: zodResolver(loginSchema),
      defaultValues: {
        email: "",
        password: "",
      },
    });
  });

  it("should pass loginAction to useFormAction", async () => {
    const { loginAction } = await import(
      "@/features/auth/login/actions/login.action"
    );

    renderHook(() => useLoginForm());

    expect(mockUseFormAction).toHaveBeenCalledWith(loginAction, mockForm);
  });

  it("should handle loading state", () => {
    mockUseFormAction.mockReturnValue({
      submitForm: mockSubmitForm,
      isLoading: true,
      actionState: null,
    });

    const { result } = renderHook(() => useLoginForm());

    expect(result.current.isLoading).toBe(true);
  });

  it("should handle successful login", () => {
    const successState = mockActionSuccess({ user: { id: "123" } });
    mockUseFormAction.mockReturnValue({
      submitForm: mockSubmitForm,
      isLoading: false,
      actionState: successState,
    });

    const { result } = renderHook(() => useLoginForm());

    expect(result.current.actionState).toBe(successState);
    expect(result.current.actionState?.success).toBe(true);
  });

  it("should handle login error", () => {
    const errorState = mockActionError("Invalid credentials", {
      email: ["Email is required"],
      password: ["Password is required"],
    });
    mockUseFormAction.mockReturnValue({
      submitForm: mockSubmitForm,
      isLoading: false,
      actionState: errorState,
    });

    const { result } = renderHook(() => useLoginForm());

    expect(result.current.actionState).toBe(errorState);
    expect(result.current.actionState?.success).toBe(false);
    expect(result.current.actionState?.error).toBe("Invalid credentials");
  });

  it("should call onSubmit when form is submitted", () => {
    const { result } = renderHook(() => useLoginForm());
    const loginData = { email: "test@example.com", password: "password123" };

    act(() => {
      result.current.onSubmit(loginData);
    });

    expect(mockSubmitForm).toHaveBeenCalledWith(loginData);
  });
});
