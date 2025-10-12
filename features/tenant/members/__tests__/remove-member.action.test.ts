import { describe, it, expect, vi, beforeEach } from "vitest";
import { removeMemberAction } from "@/features/tenant/members/actions/remove-member.action";

// Valid UUIDs for testing
const VALID_USER_UUID = "550e8400-e29b-41d4-a716-446655440001";
const VALID_USER_UUID_2 = "550e8400-e29b-41d4-a716-446655440002";
const VALID_TENANT_UUID = "550e8400-e29b-41d4-a716-446655440010";
const VALID_MEMBERSHIP_UUID = "550e8400-e29b-41d4-a716-446655440020";
const VALID_MEMBERSHIP_UUID_OWNER = "550e8400-e29b-41d4-a716-446655440021";

// Mock dependencies
vi.mock("@/shared/db/drizzle/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
  memberships: {},
}));

vi.mock("@/features/auth/shared/actions/getUserTenantData.action", () => ({
  requireTenantContext: vi.fn(),
}));

vi.mock("@/features/tenant/shared/lib/tenant", () => ({
  isUserOwnerOrAdmin: vi.fn(),
}));

describe("removeMemberAction", () => {
  const mockContext = {
    user: {
      authUser: { id: VALID_USER_UUID, email: "admin@example.com" },
      profile: { id: VALID_USER_UUID, fullName: "Admin User" },
    },
    currentTenant: {
      tenant: { id: VALID_TENANT_UUID, name: "Test Tenant" },
      membership: { role: "ADMIN" },
      isOwner: false,
      isAdmin: true,
    },
    tenants: [],
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const { requireTenantContext } = await import(
      "@/features/auth/shared/actions/getUserTenantData.action"
    );
    vi.mocked(requireTenantContext).mockResolvedValue(mockContext as any);

    const { isUserOwnerOrAdmin } = await import("@/features/tenant/shared/lib/tenant");
    vi.mocked(isUserOwnerOrAdmin).mockResolvedValue(true);
  });

  it("should remove member successfully", async () => {
    const { db } = await import("@/shared/db/drizzle/db");

    const mockMembership = {
      id: VALID_MEMBERSHIP_UUID,
      userId: VALID_USER_UUID_2,
      tenantId: VALID_TENANT_UUID,
      role: "MEMBER",
      status: "ACTIVE",
    };

    // Mock select chain
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockMembership]),
        }),
      }),
    } as any);

    // Mock update chain
    const mockSet = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });

    vi.mocked(db.update).mockReturnValue({
      set: mockSet,
    } as any);

    const formData = new FormData();
    formData.append("membershipId", VALID_MEMBERSHIP_UUID);

    const result = await removeMemberAction(formData);

    expect(result.success).toBe(true);
    expect(mockSet).toHaveBeenCalledWith({ status: "REMOVED" });
  });

  it("should require admin permissions", async () => {
    const { isUserOwnerOrAdmin } = await import("@/features/tenant/shared/lib/tenant");
    vi.mocked(isUserOwnerOrAdmin).mockResolvedValue(false);

    const formData = new FormData();
    formData.append("membershipId", VALID_MEMBERSHIP_UUID);

    const result = await removeMemberAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("permissions");
    }
  });

  it("should protect owner removal", async () => {
    const { db } = await import("@/shared/db/drizzle/db");

    const mockOwnerMembership = {
      id: VALID_MEMBERSHIP_UUID_OWNER,
      userId: VALID_USER_UUID_2,
      tenantId: VALID_TENANT_UUID,
      role: "OWNER",
      status: "ACTIVE",
    };

    // Mock select chain
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockOwnerMembership]),
        }),
      }),
    } as any);

    const formData = new FormData();
    formData.append("membershipId", VALID_MEMBERSHIP_UUID_OWNER);

    const result = await removeMemberAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("propriétaire");
    }
  });

  it("should prevent last owner removal", async () => {
    const { db } = await import("@/shared/db/drizzle/db");
    const { requireTenantContext } = await import(
      "@/features/auth/shared/actions/getUserTenantData.action"
    );

    // User is OWNER
    vi.mocked(requireTenantContext).mockResolvedValue({
      ...mockContext,
      currentTenant: {
        ...mockContext.currentTenant,
        membership: { role: "OWNER" },
        isOwner: true,
      },
    } as any);

    const mockOwnerMembership = {
      id: VALID_MEMBERSHIP_UUID_OWNER,
      userId: VALID_USER_UUID, // Same as current user
      tenantId: VALID_TENANT_UUID,
      role: "OWNER",
      status: "ACTIVE",
    };

    let selectCallCount = 0;
    const mockSelect = vi.fn().mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        // First call: get membership
        return {
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([mockOwnerMembership]),
            }),
          }),
        };
      } else {
        // Second call: count owners
        return {
          from: () => ({
            where: () => Promise.resolve([{ count: 1 }]),
          }),
        };
      }
    });

    vi.mocked(db.select).mockImplementation(mockSelect as any);

    const formData = new FormData();
    formData.append("membershipId", VALID_MEMBERSHIP_UUID_OWNER);

    const result = await removeMemberAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("seul propriétaire");
    }
  });
});
