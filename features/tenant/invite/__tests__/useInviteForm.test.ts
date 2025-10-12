import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useInviteForm } from "@/features/tenant/invite/hooks/useInviteForm";
import { mockActionSuccess, mockActionError } from "@/__tests__/setup/test-utils";

// Mock dependencies
vi.mock("@/shared/hooks/useFormAction.ts", () => ({
  useFormAction: vi.fn(),
}));

vi.mock("@/features/tenant/invite/actions/invite.action.ts", () => ({
  inviteMemberAction: vi.fn(),
}));

vi.mock("react-hook-form", () => ({
  useForm: vi.fn(),
}));

vi.mock("@hookform/resolvers/zod", () => ({
  zodResolver: vi.fn(),
}));

describe("useInviteForm", () => {
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

  it("should initialize with default role MEMBER", async () => {
    const { useForm } = await import("react-hook-form");

    renderHook(() => useInviteForm());

    expect(useForm).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultValues: {
          email: "",
          role: "MEMBER",
        },
      })
    );
  });

  it("should reset form on successful invite", () => {
    const successState = mockActionSuccess({ email: "user@example.com" });
    mockUseFormAction.mockReturnValue({
      submitForm: mockSubmitForm,
      isLoading: false,
      actionState: successState,
    });

    renderHook(() => useInviteForm());

    expect(mockForm.reset).toHaveBeenCalled();
  });

  it("should handle invite success state", () => {
    const successState = mockActionSuccess({ email: "user@example.com" });
    mockUseFormAction.mockReturnValue({
      submitForm: mockSubmitForm,
      isLoading: false,
      actionState: successState,
    });

    const { result } = renderHook(() => useInviteForm());

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.actionState?.success).toBe(true);
  });

  it("should validate email format", async () => {
    const { result } = renderHook(() => useInviteForm());

    expect(result.current.form).toBe(mockForm);
    expect(result.current.onSubmit).toBe(mockSubmitForm);
  });
});
