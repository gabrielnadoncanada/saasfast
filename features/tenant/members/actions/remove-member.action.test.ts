import { describe, it, expect, vi, beforeEach } from "vitest";
import { removeMemberAction } from "./remove-member.action";
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

function createFormData(membershipId: string): FormData {
  const formData = new FormData();
  formData.append("membershipId", membershipId);
  return formData;
}

describe("removeMemberAction", () => {
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

  it("successfully removes member", async () => {
    const formData = createFormData("membership-123");

    (safeParseForm as any).mockResolvedValue({
      success: true,
      data: { membershipId: "membership-123" },
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

    // Mock successful update (soft delete)
    const mockUpdate = (db as any).__mocks.mockUpdate;
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue({}),
    });

    const result = await removeMemberAction(formData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        membershipId: "membership-123",
      });
    }
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("rejects removal from non-admin user", async () => {
    const formData = createFormData("membership-123");

    (safeParseForm as any).mockResolvedValue({
      success: true,
      data: { membershipId: "membership-123" },
    });

    (isUserOwnerOrAdmin as any).mockResolvedValue(false);

    const result = await removeMemberAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("permissions");
    }
  });

  it("rejects removal for non-existent membership", async () => {
    const formData = createFormData("non-existent-123");

    (safeParseForm as any).mockResolvedValue({
      success: true,
      data: { membershipId: "non-existent-123" },
    });

    // Mock no membership found
    const mockSelect = (db as any).__mocks.mockSelect;
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]), // No membership found
    });

    const result = await removeMemberAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("introuvable");
    }
  });

  it("prevents non-owner from removing owner", async () => {
    const formData = createFormData("owner-membership-123");

    (safeParseForm as any).mockResolvedValue({
      success: true,
      data: { membershipId: "owner-membership-123" },
    });

    // Mock admin user (not owner)
    (getCurrentUserTenantContext as any).mockResolvedValue({
      user: { id: "admin-123" },
      tenant: { id: "tenant-123" },
      membership: { role: "ADMIN" },
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

    const result = await removeMemberAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("propriétaires");
    }
  });

  it("prevents last owner from removing themselves", async () => {
    const formData = createFormData("owner-membership-123");

    (safeParseForm as any).mockResolvedValue({
      success: true,
      data: { membershipId: "owner-membership-123" },
    });

    // Mock owner user removing themselves
    (getCurrentUserTenantContext as any).mockResolvedValue({
      user: { id: "owner-123" },
      tenant: { id: "tenant-123" },
      membership: { role: "OWNER" },
    });

    let selectCallCount = 0;
    const mockSelect = (db as any).__mocks.mockSelect;
    mockSelect.mockImplementation(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          // First call: get the membership to remove
          return Promise.resolve([
            {
              id: "owner-membership-123",
              role: "OWNER",
              userId: "owner-123", // Same as current user
            },
          ]);
        } else {
          // Second call: count owners
          return Promise.resolve([{ count: 1 }]); // Only one owner
        }
      }),
    }));

    const result = await removeMemberAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("seul propriétaire");
    }
  });

  it("allows owner to remove themselves when multiple owners exist", async () => {
    const formData = createFormData("owner-membership-123");

    (safeParseForm as any).mockResolvedValue({
      success: true,
      data: { membershipId: "owner-membership-123" },
    });

    // Mock owner user removing themselves
    (getCurrentUserTenantContext as any).mockResolvedValue({
      user: { id: "owner-123" },
      tenant: { id: "tenant-123" },
      membership: { role: "OWNER" },
    });

    let selectCallCount = 0;
    const mockSelect = (db as any).__mocks.mockSelect;
    mockSelect.mockImplementation((fields?: any) => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          // First call: get the membership to remove (followed by limit)
          return {
            limit: vi.fn().mockResolvedValue([
              {
                id: "owner-membership-123",
                role: "OWNER",
                userId: "owner-123",
              },
            ]),
          };
        } else {
          // Second call: count owners (ends at where)
          return Promise.resolve([{ count: 2 }]); // Multiple owners
        }
      }),
      limit: vi.fn().mockResolvedValue([]), // fallback
    }));

    // Mock successful update
    const mockUpdate = (db as any).__mocks.mockUpdate;
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue({}),
    });

    const result = await removeMemberAction(formData);

    expect(result.success).toBe(true);
  });

  it("validates membershipId format", async () => {
    const formData = createFormData("invalid-id");

    (safeParseForm as any).mockResolvedValue({
      success: false,
      error: "ID de membership invalide",
      fieldErrors: { membershipId: ["ID de membership invalide"] },
    });

    const result = await removeMemberAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ID de membership invalide");
    }
  });

  it("uses soft delete by setting status to REMOVED", async () => {
    const formData = createFormData("membership-123");

    (safeParseForm as any).mockResolvedValue({
      success: true,
      data: { membershipId: "membership-123" },
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

    // Mock and verify update call
    const mockUpdate = (db as any).__mocks.mockUpdate;
    const mockSet = vi.fn().mockReturnThis();
    mockUpdate.mockReturnValue({
      set: mockSet,
      where: vi.fn().mockResolvedValue({}),
    });

    const result = await removeMemberAction(formData);

    expect(result.success).toBe(true);
    expect(mockSet).toHaveBeenCalledWith({ status: "REMOVED" });
  });

  it("handles database errors gracefully", async () => {
    const formData = createFormData("membership-123");

    (safeParseForm as any).mockResolvedValue({
      success: true,
      data: { membershipId: "membership-123" },
    });

    // Mock database error
    const mockSelect = (db as any).__mocks.mockSelect;
    mockSelect.mockImplementation(() => {
      throw new Error("Database connection failed");
    });

    const result = await removeMemberAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Erreur lors de la suppression");
    }
  });
});
