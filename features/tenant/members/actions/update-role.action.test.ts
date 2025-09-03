import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateMemberRoleAction } from "./update-role.action";
import { safeParseForm } from "@/shared/lib/safeParseForm";

// Mock dependencies
vi.mock("@/shared/lib/safeParseForm", () => ({
  safeParseForm: vi.fn(),
}));

vi.mock("@/features/tenant/shared/lib/context", () => ({
  getCurrentUserTenantContext: vi.fn(),
  requireTenantContext: vi.fn(),
}));

vi.mock("@/features/tenant/shared/lib/tenant", () => ({
  isUserOwnerOrAdmin: vi.fn(),
}));

vi.mock("@/shared/db", () => {
  const mockSelect = vi.fn();
  const mockUpdate = vi.fn();
  const mockWhere = vi.fn();
  const mockLimit = vi.fn();
  const mockSet = vi.fn();

  return {
    db: {
      select: mockSelect,
      update: mockUpdate,
      __mocks: {
        mockSelect,
        mockUpdate,
        mockWhere,
        mockLimit,
        mockSet,
      },
    },
    memberships: {},
  };
});

const { getCurrentUserTenantContext, requireTenantContext } = await import(
  "@/features/tenant/shared/lib/context"
);
const { isUserOwnerOrAdmin } = await import(
  "@/features/tenant/shared/lib/tenant"
);
const { db } = await import("@/shared/db/drizzle/db");

function createFormData(membershipId: string, newRole: string): FormData {
  const formData = new FormData();
  formData.append("membershipId", membershipId);
  formData.append("newRole", newRole);
  return formData;
}

describe("updateMemberRoleAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for context
    (getCurrentUserTenantContext as any).mockResolvedValue({
      user: { id: "admin-123" },
      tenant: { id: "tenant-123" },
      membership: { role: "OWNER" },
    });

    (requireTenantContext as any).mockImplementation(() => {});
    (isUserOwnerOrAdmin as any).mockResolvedValue(true);
  });

  it("successfully updates member role", async () => {
    const formData = createFormData("membership-123", "ADMIN");

    (safeParseForm as any).mockResolvedValue({
      success: true,
      data: { membershipId: "membership-123", newRole: "ADMIN" },
    });

    // Mock existing membership
    const mockSelect = (db as any).__mocks.mockSelect;
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: "membership-123",
          role: "MEMBER",
          userId: "member-123",
        },
      ]),
    });

    // Mock successful update
    const mockUpdate = (db as any).__mocks.mockUpdate;
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue({}),
    });

    const result = await updateMemberRoleAction(formData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        membershipId: "membership-123",
        newRole: "ADMIN",
      });
    }
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("rejects update from non-admin user", async () => {
    const formData = createFormData("membership-123", "ADMIN");

    (safeParseForm as any).mockResolvedValue({
      success: true,
      data: { membershipId: "membership-123", newRole: "ADMIN" },
    });

    (isUserOwnerOrAdmin as any).mockResolvedValue(false);

    const result = await updateMemberRoleAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("permissions");
    }
  });

  it("rejects update for non-existent membership", async () => {
    const formData = createFormData("non-existent-123", "ADMIN");

    (safeParseForm as any).mockResolvedValue({
      success: true,
      data: { membershipId: "non-existent-123", newRole: "ADMIN" },
    });

    // Mock no membership found
    const mockSelect = (db as any).__mocks.mockSelect;
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]), // No membership found
    });

    const result = await updateMemberRoleAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("introuvable");
    }
  });

  it("prevents non-owner from modifying owner role", async () => {
    const formData = createFormData("owner-membership-123", "ADMIN");

    (safeParseForm as any).mockResolvedValue({
      success: true,
      data: { membershipId: "owner-membership-123", newRole: "ADMIN" },
    });

    // Mock admin user (not owner)
    (getCurrentUserTenantContext as any).mockResolvedValue({
      user: { id: "admin-123" },
      tenant: { id: "tenant-123" },
      membership: { role: "ADMIN" }, // Not OWNER
    });

    // Mock existing owner membership
    const mockSelect = (db as any).__mocks.mockSelect;
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: "owner-membership-123",
          role: "OWNER",
          userId: "owner-123",
        },
      ]),
    });

    const result = await updateMemberRoleAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("propriétaires");
    }
  });

  it("prevents non-owner from promoting to owner", async () => {
    const formData = createFormData("membership-123", "OWNER");

    (safeParseForm as any).mockResolvedValue({
      success: true,
      data: { membershipId: "membership-123", newRole: "OWNER" },
    });

    // Mock admin user (not owner)
    (getCurrentUserTenantContext as any).mockResolvedValue({
      user: { id: "admin-123" },
      tenant: { id: "tenant-123" },
      membership: { role: "ADMIN" },
    });

    // Mock existing member
    const mockSelect = (db as any).__mocks.mockSelect;
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: "membership-123",
          role: "MEMBER",
          userId: "member-123",
        },
      ]),
    });

    const result = await updateMemberRoleAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("propriétaire");
    }
  });

  it("allows owner to promote to owner", async () => {
    const formData = createFormData("membership-123", "OWNER");

    (safeParseForm as any).mockResolvedValue({
      success: true,
      data: { membershipId: "membership-123", newRole: "OWNER" },
    });

    // Mock owner user
    (getCurrentUserTenantContext as any).mockResolvedValue({
      user: { id: "owner-123" },
      tenant: { id: "tenant-123" },
      membership: { role: "OWNER" },
    });

    // Mock existing member
    const mockSelect = (db as any).__mocks.mockSelect;
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: "membership-123",
          role: "MEMBER",
          userId: "member-123",
        },
      ]),
    });

    // Mock successful update
    const mockUpdate = (db as any).__mocks.mockUpdate;
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue({}),
    });

    const result = await updateMemberRoleAction(formData);

    expect(result.success).toBe(true);
  });

  it("validates membershipId format", async () => {
    const formData = createFormData("invalid-id", "ADMIN");

    (safeParseForm as any).mockResolvedValue({
      success: false,
      error: "ID de membership invalide",
      fieldErrors: { membershipId: ["ID de membership invalide"] },
    });

    const result = await updateMemberRoleAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ID de membership invalide");
    }
  });

  it("validates role enum", async () => {
    const formData = createFormData("membership-123", "INVALID_ROLE");

    (safeParseForm as any).mockResolvedValue({
      success: false,
      error: "Rôle invalide",
      fieldErrors: { newRole: ["Rôle invalide"] },
    });

    const result = await updateMemberRoleAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Rôle invalide");
    }
  });

  it("handles database errors gracefully", async () => {
    const formData = createFormData("membership-123", "ADMIN");

    (safeParseForm as any).mockResolvedValue({
      success: true,
      data: { membershipId: "membership-123", newRole: "ADMIN" },
    });

    // Mock database error
    const mockSelect = (db as any).__mocks.mockSelect;
    mockSelect.mockImplementation(() => {
      throw new Error("Database connection failed");
    });

    const result = await updateMemberRoleAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Erreur lors de la modification");
    }
  });
});
