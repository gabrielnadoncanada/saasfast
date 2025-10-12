import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRegisterForm } from "@/features/auth/register/hooks/useRegisterForm";
import { mockActionSuccess, mockActionError } from "@/__tests__/setup/test-utils";

// Mock dependencies
vi.mock("@/shared/hooks/useFormAction.ts", () => ({
  useFormAction: vi.fn(),
}));

vi.mock("@/features/auth/register/actions/register.action.ts", () => ({
  registerAction: vi.fn(),
}));

vi.mock("@/features/auth/shared/schema/auth.schema.ts", () => ({
  registerSchema: {
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

describe("useRegisterForm", () => {
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
    const { result } = renderHook(() => useRegisterForm());

    expect(result.current.form).toBe(mockForm);
    expect(result.current.onSubmit).toBe(mockSubmitForm);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.actionState).toBe(null);
  });

  it("should use registerSchema for validation", async () => {
    const { useForm } = await import("react-hook-form");
    const { zodResolver } = await import("@hookform/resolvers/zod");
    const { registerSchema } = await import("@/features/auth/shared/schema/auth.schema");

    renderHook(() => useRegisterForm());

    expect(useForm).toHaveBeenCalledWith({
      resolver: zodResolver(registerSchema),
      defaultValues: {
        full_name: "",
        email: "",
        password: "",
      },
    });
  });

  it("should pass registerAction to useFormAction", async () => {
    const { registerAction } = await import("@/features/auth/register/actions/register.action");

    renderHook(() => useRegisterForm());

    expect(mockUseFormAction).toHaveBeenCalledWith(registerAction, mockForm);
  });

  it("should handle loading state", () => {
    mockUseFormAction.mockReturnValue({
      submitForm: mockSubmitForm,
      isLoading: true,
      actionState: null,
    });

    const { result } = renderHook(() => useRegisterForm());

    expect(result.current.isLoading).toBe(true);
  });

  it("should handle successful registration", () => {
    const successState = mockActionSuccess({ userId: "123" });
    mockUseFormAction.mockReturnValue({
      submitForm: mockSubmitForm,
      isLoading: false,
      actionState: successState,
    });

    const { result } = renderHook(() => useRegisterForm());

    expect(result.current.actionState).toBe(successState);
    expect(result.current.actionState?.success).toBe(true);
  });

  it("should handle registration errors", () => {
    const errorState = mockActionError("Email déjà utilisé", {
      email: ["Cette adresse e-mail est déjà utilisée"],
    });
    mockUseFormAction.mockReturnValue({
      submitForm: mockSubmitForm,
      isLoading: false,
      actionState: errorState,
    });

    const { result } = renderHook(() => useRegisterForm());

    expect(result.current.actionState).toBe(errorState);
    expect(result.current.actionState?.success).toBe(false);
    if (result.current.actionState && !result.current.actionState.success) {
      expect(result.current.actionState.error).toBe("Email déjà utilisé");
    }
  });
});
