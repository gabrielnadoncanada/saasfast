import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCreateTenantForm } from "@/features/tenant/create/hooks/useCreateTenantForm";
import { mockActionSuccess, mockActionError } from "@/__tests__/setup/test-utils";

// Mock dependencies
vi.mock("@/shared/hooks/useFormAction.ts", () => ({
  useFormAction: vi.fn(),
}));

vi.mock("@/features/tenant/create/actions/createTenant.action.ts", () => ({
  createTenantAction: vi.fn(),
}));

vi.mock("@/features/auth/shared/ui/UserTenantProvider", () => ({
  useUser: vi.fn(),
}));

vi.mock("react-hook-form", () => ({
  useForm: vi.fn(),
}));

vi.mock("@hookform/resolvers/zod", () => ({
  zodResolver: vi.fn(),
}));

describe("useCreateTenantForm", () => {
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
  const mockRefreshTenants = vi.fn();
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

    // Mock useUser
    const { useUser } = await import("@/features/auth/shared/ui/UserTenantProvider");
    vi.mocked(useUser).mockReturnValue({
      refreshTenants: mockRefreshTenants,
    } as any);
  });

  it("should initialize form with empty name", () => {
    const { result } = renderHook(() => useCreateTenantForm());

    expect(result.current.form).toBe(mockForm);
    expect(result.current.isSuccess).toBe(false);
  });

  it("should handle successful creation", () => {
    const successState = mockActionSuccess({ tenantId: "tenant-123" });
    mockUseFormAction.mockReturnValue({
      submitForm: mockSubmitForm,
      isLoading: false,
      actionState: successState,
    });

    const { result } = renderHook(() => useCreateTenantForm());

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.actionState?.success).toBe(true);
  });

  it("should reset form on success", () => {
    const successState = mockActionSuccess({ tenantId: "tenant-123" });
    mockUseFormAction.mockReturnValue({
      submitForm: mockSubmitForm,
      isLoading: false,
      actionState: successState,
    });

    renderHook(() => useCreateTenantForm());

    expect(mockForm.reset).toHaveBeenCalled();
  });

  it("should refresh tenants on success", () => {
    const successState = mockActionSuccess({ tenantId: "tenant-123" });
    mockUseFormAction.mockReturnValue({
      submitForm: mockSubmitForm,
      isLoading: false,
      actionState: successState,
    });

    renderHook(() => useCreateTenantForm());

    expect(mockRefreshTenants).toHaveBeenCalled();
  });

  it("should handle creation errors", () => {
    const errorState = mockActionError("Failed to create tenant");
    mockUseFormAction.mockReturnValue({
      submitForm: mockSubmitForm,
      isLoading: false,
      actionState: errorState,
    });

    const { result } = renderHook(() => useCreateTenantForm());

    expect(result.current.isSuccess).toBe(false);
    expect(result.current.actionState?.success).toBe(false);
  });
});
