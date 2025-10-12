import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDeleteTenant } from "@/features/tenant/delete/hooks/useDeleteTenant";
import { mockActionSuccess, mockActionError } from "@/__tests__/setup/test-utils";

// Mock dependencies
vi.mock("@/shared/hooks/useAction.ts", () => ({
  useAction: vi.fn(),
}));

vi.mock("@/features/tenant/delete/actions/deleteTenant.action.ts", () => ({
  deleteTenantAction: vi.fn(),
}));

vi.mock("@/features/auth/shared/ui/UserTenantProvider", () => ({
  useUser: vi.fn(),
}));

describe("useDeleteTenant", () => {
  const mockExecuteAction = vi.fn();
  const mockRefreshTenants = vi.fn();
  const mockUseAction = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock useAction
    const { useAction } = await import("@/shared/hooks/useAction");
    mockUseAction.mockReturnValue({
      executeAction: mockExecuteAction,
      isLoading: false,
      actionState: null,
    });
    vi.mocked(useAction).mockImplementation(mockUseAction);

    // Mock useUser
    const { useUser } = await import("@/features/auth/shared/ui/UserTenantProvider");
    vi.mocked(useUser).mockReturnValue({
      refreshTenants: mockRefreshTenants,
    } as any);
  });

  it("should delete tenant by ID", () => {
    const { result } = renderHook(() => useDeleteTenant());

    result.current.deleteTenant("tenant-123");

    expect(mockExecuteAction).toHaveBeenCalledWith({ tenantId: "tenant-123" });
  });

  it("should refresh tenants on success", () => {
    const successState = mockActionSuccess({ tenantId: "tenant-123" });
    mockUseAction.mockReturnValue({
      executeAction: mockExecuteAction,
      isLoading: false,
      actionState: successState,
    });

    renderHook(() => useDeleteTenant());

    expect(mockRefreshTenants).toHaveBeenCalled();
  });

  it("should handle deletion errors", () => {
    const errorState = mockActionError("Failed to delete tenant");
    mockUseAction.mockReturnValue({
      executeAction: mockExecuteAction,
      isLoading: false,
      actionState: errorState,
    });

    const { result } = renderHook(() => useDeleteTenant());

    expect(result.current.actionState?.success).toBe(false);
    if (result.current.actionState && !result.current.actionState.success) {
      expect(result.current.actionState.error).toBe("Failed to delete tenant");
    }
  });

  it("should manage loading state", () => {
    mockUseAction.mockReturnValue({
      executeAction: mockExecuteAction,
      isLoading: true,
      actionState: null,
    });

    const { result } = renderHook(() => useDeleteTenant());

    expect(result.current.isLoading).toBe(true);
  });
});
