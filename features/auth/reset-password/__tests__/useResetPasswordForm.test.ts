import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useResetPasswordForm } from "@/features/auth/reset-password/hooks/useResetPasswordForm";

// Mock dependencies
vi.mock("@/shared/hooks/useFormAction.ts", () => ({
  useFormAction: vi.fn(),
}));

vi.mock("@/features/auth/reset-password/actions/resetPassword.action.ts", () => ({
  resetPasswordAction: vi.fn(),
}));

vi.mock("react-hook-form", () => ({
  useForm: vi.fn(),
}));

vi.mock("@hookform/resolvers/zod", () => ({
  zodResolver: vi.fn(),
}));

describe("useResetPasswordForm", () => {
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

  it("should initialize with password default value", async () => {
    const { useForm } = await import("react-hook-form");
    const { zodResolver } = await import("@hookform/resolvers/zod");
    const { resetPasswordSchema } = await import("@/features/auth/shared/schema/auth.schema");

    renderHook(() => useResetPasswordForm());

    expect(useForm).toHaveBeenCalledWith({
      resolver: zodResolver(resetPasswordSchema),
      defaultValues: {
        password: "",
      },
    });
  });

  it("should use resetPasswordSchema for validation", async () => {
    const { zodResolver } = await import("@hookform/resolvers/zod");
    const { resetPasswordSchema } = await import("@/features/auth/shared/schema/auth.schema");

    renderHook(() => useResetPasswordForm());

    const { useForm } = await import("react-hook-form");
    expect(useForm).toHaveBeenCalledWith(
      expect.objectContaining({
        resolver: zodResolver(resetPasswordSchema),
      })
    );
  });

  it("should integrate with useFormAction", async () => {
    const { resetPasswordAction } = await import(
      "@/features/auth/reset-password/actions/resetPassword.action"
    );

    renderHook(() => useResetPasswordForm());

    expect(mockUseFormAction).toHaveBeenCalledWith(resetPasswordAction, mockForm);
  });
});
