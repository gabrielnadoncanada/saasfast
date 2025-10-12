import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateMemberRoleAction } from "@/features/tenant/members/actions/update-role.action";

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

describe("updateMemberRoleAction", () => {
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

  it("should update role successfully", async () => {
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
    formData.append("newRole", "ADMIN");

    const result = await updateMemberRoleAction(formData);

    expect(result.success).toBe(true);
    expect(mockSet).toHaveBeenCalledWith({ role: "ADMIN" });
  });

  it("should require admin permissions", async () => {
    const { isUserOwnerOrAdmin } = await import("@/features/tenant/shared/lib/tenant");
    vi.mocked(isUserOwnerOrAdmin).mockResolvedValue(false);

    const formData = new FormData();
    formData.append("membershipId", VALID_MEMBERSHIP_UUID);
    formData.append("newRole", "ADMIN");

    const result = await updateMemberRoleAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("permissions");
    }
  });

  it("should protect owner role changes", async () => {
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
    formData.append("newRole", "MEMBER");

    const result = await updateMemberRoleAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("propriétaire");
    }
  });

  it("should prevent non-owner promotion to owner", async () => {
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

    const formData = new FormData();
    formData.append("membershipId", VALID_MEMBERSHIP_UUID);
    formData.append("newRole", "OWNER");

    const result = await updateMemberRoleAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("promouvoir");
    }
  });
});
