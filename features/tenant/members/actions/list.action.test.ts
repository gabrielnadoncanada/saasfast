import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTeamMembersAction } from "./list.action";

// Mock dependencies
vi.mock("@/features/tenant/shared/lib/scoped-db", () => ({
  withScopedDb: vi.fn(),
}));

vi.mock("@/features/tenant/shared/lib/queries", () => ({
  withTenantScope: vi.fn(),
}));

vi.mock("@/shared/db", () => ({
  memberships: { tenantId: "memberships.tenantId" },
  profiles: { id: "profiles.id" },
  invitations: { tenantId: "invitations.tenantId", acceptedAt: "invitations.acceptedAt" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  desc: vi.fn(),
  isNull: vi.fn(),
}));

const { withScopedDb } = await import("@/features/tenant/shared/lib/scoped-db");
const { withTenantScope } = await import("@/features/tenant/shared/lib/queries");
const { eq, desc, isNull } = await import("drizzle-orm");

describe("getTeamMembersAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns members and pending invitations scoped to tenant", async () => {
    const mockMembers = [
      {
        id: "membership-1",
        role: "OWNER",
        status: "ACTIVE",
        createdAt: new Date("2023-01-01"),
        user: {
          id: "user-1",
          email: "owner@example.com",
          name: "Owner User",
          avatarUrl: null,
        },
      },
      {
        id: "membership-2",
        role: "MEMBER",
        status: "ACTIVE",
        createdAt: new Date("2023-01-02"),
        user: {
          id: "user-2",
          email: "member@example.com",
          name: "Member User",
          avatarUrl: "https://example.com/avatar.jpg",
        },
      },
    ];

    const mockInvitations = [
      {
        id: "invitation-1",
        tenantId: "tenant-123",
        email: "pending@example.com",
        role: "ADMIN",
        token: "token-123",
        expiresAt: new Date("2023-12-31"),
        createdAt: new Date("2023-01-03"),
        acceptedAt: null,
      },
    ];

    // Mock scoped database operations
    const mockScopedDb = {
      tenantId: "tenant-123",
      db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn(),
      },
    };

    // Setup call sequence for members query
    mockScopedDb.db.orderBy.mockResolvedValueOnce(mockMembers);
    // Setup call sequence for invitations query  
    mockScopedDb.db.orderBy.mockResolvedValueOnce(mockInvitations);

    (withScopedDb as any).mockImplementation(async (callback: (db: any) => Promise<any>) => {
      return callback(mockScopedDb);
    });

    (withTenantScope as any).mockReturnValue("tenant-scoped-condition");
    (eq as any).mockReturnValue("eq-condition");
    (desc as any).mockReturnValue("desc-condition");
    (isNull as any).mockReturnValue("isNull-condition");

    const result = await getTeamMembersAction();

    expect(result).toEqual({
      members: mockMembers,
      pendingInvitations: mockInvitations,
    });

    // Verify withScopedDb was called
    expect(withScopedDb).toHaveBeenCalledWith(expect.any(Function));

    // Verify tenant scoping was applied
    expect(withTenantScope).toHaveBeenCalledTimes(2);
    expect(withTenantScope).toHaveBeenCalledWith(
      mockScopedDb,
      "memberships.tenantId"
    );
    expect(withTenantScope).toHaveBeenCalledWith(
      mockScopedDb,
      "invitations.tenantId",
      "isNull-condition"
    );

    // Verify database queries were made
    expect(mockScopedDb.db.select).toHaveBeenCalledTimes(2);
    expect(mockScopedDb.db.from).toHaveBeenCalledTimes(2);
    expect(mockScopedDb.db.where).toHaveBeenCalledTimes(2);
    expect(mockScopedDb.db.orderBy).toHaveBeenCalledTimes(2);
  });

  it("handles empty results", async () => {
    const mockScopedDb = {
      tenantId: "tenant-123",
      db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn(),
      },
    };

    // Mock empty results
    mockScopedDb.db.orderBy.mockResolvedValueOnce([]); // No members
    mockScopedDb.db.orderBy.mockResolvedValueOnce([]); // No invitations

    (withScopedDb as any).mockImplementation(async (callback: (db: any) => Promise<any>) => {
      return callback(mockScopedDb);
    });

    (withTenantScope as any).mockReturnValue("tenant-scoped-condition");

    const result = await getTeamMembersAction();

    expect(result).toEqual({
      members: [],
      pendingInvitations: [],
    });
  });

  it("propagates database errors", async () => {
    const mockScopedDb = {
      tenantId: "tenant-123",
      db: {
        select: vi.fn().mockImplementation(() => {
          throw new Error("Database connection failed");
        }),
      },
    };

    (withScopedDb as any).mockImplementation(async (callback: (db: any) => Promise<any>) => {
      return callback(mockScopedDb);
    });

    await expect(getTeamMembersAction()).rejects.toThrow("Database connection failed");
  });

  it("propagates scoped database errors", async () => {
    (withScopedDb as any).mockRejectedValue(new Error("Authentication failed"));

    await expect(getTeamMembersAction()).rejects.toThrow("Authentication failed");
  });

  it("filters out accepted invitations", async () => {
    const mockScopedDb = {
      tenantId: "tenant-123",
      db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn(),
      },
    };

    mockScopedDb.db.orderBy.mockResolvedValueOnce([]); // No members
    mockScopedDb.db.orderBy.mockResolvedValueOnce([]); // No pending invitations

    (withScopedDb as any).mockImplementation(async (callback: (db: any) => Promise<any>) => {
      return callback(mockScopedDb);
    });

    (withTenantScope as any).mockReturnValue("tenant-scoped-condition");
    (isNull as any).mockReturnValue("isNull-condition");

    await getTeamMembersAction();

    // Verify that isNull is used to filter out accepted invitations
    expect(isNull).toHaveBeenCalledWith("invitations.acceptedAt");
    expect(withTenantScope).toHaveBeenCalledWith(
      mockScopedDb,
      "invitations.tenantId",
      "isNull-condition"
    );
  });

  it("orders results by creation date descending", async () => {
    const mockScopedDb = {
      tenantId: "tenant-123",
      db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      },
    };

    (withScopedDb as any).mockImplementation(async (callback: (db: any) => Promise<any>) => {
      return callback(mockScopedDb);
    });

    (withTenantScope as any).mockReturnValue("tenant-scoped-condition");
    (desc as any).mockReturnValue("desc-condition");

    await getTeamMembersAction();

    // Verify desc ordering is applied
    expect(desc).toHaveBeenCalledTimes(2);
    expect(mockScopedDb.db.orderBy).toHaveBeenCalledWith("desc-condition");
  });
});