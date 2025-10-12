import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useForgotPasswordForm } from "@/features/auth/forgot-password/hooks/useForgotPasswordForm";
import { mockActionSuccess, mockActionError } from "@/__tests__/setup/test-utils";

// Mock dependencies
vi.mock("@/shared/hooks/useFormAction.ts", () => ({
  useFormAction: vi.fn(),
}));

vi.mock("@/features/auth/forgot-password/actions/forgotPassword.action.ts", () => ({
  forgotPasswordAction: vi.fn(),
}));

vi.mock("react-hook-form", () => ({
  useForm: vi.fn(),
}));

vi.mock("@hookform/resolvers/zod", () => ({
  zodResolver: vi.fn(),
}));

describe("useForgotPasswordForm", () => {
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

  it("should initialize with email default value", async () => {
    const { useForm } = await import("react-hook-form");
    const { zodResolver } = await import("@hookform/resolvers/zod");
    const { forgotPasswordSchema } = await import("@/features/auth/shared/schema/auth.schema");

    renderHook(() => useForgotPasswordForm());

    expect(useForm).toHaveBeenCalledWith({
      resolver: zodResolver(forgotPasswordSchema),
      defaultValues: {
        email: "",
      },
    });
  });

  it("should handle success state changes", () => {
    const successState = mockActionSuccess({});
    mockUseFormAction.mockReturnValue({
      submitForm: mockSubmitForm,
      isLoading: false,
      actionState: successState,
    });

    const { result } = renderHook(() => useForgotPasswordForm());

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.actionState?.success).toBe(true);
  });

  it("should reset success state on error", () => {
    const errorState = mockActionError("Invalid email");
    mockUseFormAction.mockReturnValue({
      submitForm: mockSubmitForm,
      isLoading: false,
      actionState: errorState,
    });

    const { result } = renderHook(() => useForgotPasswordForm());

    expect(result.current.isSuccess).toBe(false);
    expect(result.current.actionState?.success).toBe(false);
  });

  it("should use forgotPasswordAction", async () => {
    const { forgotPasswordAction } = await import(
      "@/features/auth/forgot-password/actions/forgotPassword.action"
    );

    renderHook(() => useForgotPasswordForm());

    expect(mockUseFormAction).toHaveBeenCalledWith(forgotPasswordAction, mockForm);
  });
});
