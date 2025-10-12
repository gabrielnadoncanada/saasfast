import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getInitialUserTenantData,
  getUserTenants,
  requireTenantContext,
  switchTenant,
  requireTenantAccess,
  updateCurrentTenant,
} from "@/features/auth/shared/actions/getUserTenantData.action";

// Mock dependencies
vi.mock("@/shared/db/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/shared/db/drizzle/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
  profiles: {
    id: "id",
    currentTenantId: "currentTenantId",
  },
  tenants: {
    id: "id",
  },
  memberships: {
    userId: "userId",
    tenantId: "tenantId",
    status: "status",
    createdAt: "createdAt",
    role: "role",
    id: "id",
  },
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("getInitialUserTenantData", () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
  };

  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    innerJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const { redirect } = await import("next/navigation");
    vi.mocked(redirect).mockImplementation(() => undefined);
    const { createClient } = await import("@/shared/db/supabase/server");
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const { db } = await import("@/shared/db/drizzle/db");
    Object.assign(db, mockDb);
  });

  it("should return null for unauthenticated user", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Not authenticated"),
    });

    const result = await getInitialUserTenantData();

    expect(result).toEqual({
      user: null,
      currentTenant: null,
      tenants: [],
    });
  });

  it("should return user data with tenants", async () => {
    const mockUser = { id: "user-123", email: "test@example.com" };
    const mockProfile = {
      id: "user-123",
      fullName: "Test User",
      currentTenantId: "tenant-1",
    };
    const mockTenant = {
      id: "tenant-1",
      name: "Test Tenant",
    };
    const mockMembership = {
      id: "mem-1",
      role: "OWNER",
      status: "ACTIVE",
      createdAt: new Date(),
      userId: "user-123",
      tenantId: "tenant-1",
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock profile query
    mockDb.limit.mockResolvedValueOnce([mockProfile]);

    // Mock tenants query
    mockDb.orderBy.mockResolvedValueOnce([
      { tenant: mockTenant, membership: mockMembership },
    ]);

    const result = await getInitialUserTenantData();

    expect(result.user).toEqual({
      authUser: mockUser,
      profile: mockProfile,
    });
    expect(result.currentTenant).toBeDefined();
    expect(result.tenants).toHaveLength(1);
  });

  it("should handle user without profile", async () => {
    const mockUser = { id: "user-123", email: "test@example.com" };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockDb.limit.mockResolvedValueOnce([]);

    const result = await getInitialUserTenantData();

    expect(result).toEqual({
      user: { authUser: mockUser, profile: null },
      currentTenant: null,
      tenants: [],
    });
  });

  it("should set current tenant correctly", async () => {
    const mockUser = { id: "user-123", email: "test@example.com" };
    const mockProfile = {
      id: "user-123",
      fullName: "Test User",
      currentTenantId: null,
    };
    const mockTenant = {
      id: "tenant-1",
      name: "Test Tenant",
    };
    const mockMembership = {
      id: "mem-1",
      role: "OWNER",
      status: "ACTIVE",
      createdAt: new Date(),
      userId: "user-123",
      tenantId: "tenant-1",
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockDb.limit.mockResolvedValueOnce([mockProfile]);
    mockDb.orderBy.mockResolvedValueOnce([
      { tenant: mockTenant, membership: mockMembership },
    ]);

    await getInitialUserTenantData();

    // Devrait mettre à jour le currentTenantId
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.set).toHaveBeenCalledWith({ currentTenantId: "tenant-1" });
  });
});

describe("getUserTenants", () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const { db } = await import("@/shared/db/drizzle/db");
    Object.assign(db, mockDb);
  });

  it("should return user tenants with permissions", async () => {
    const mockResults = [
      {
        tenant: { id: "tenant-1", name: "Tenant 1" },
        membership: {
          id: "mem-1",
          role: "OWNER",
          status: "ACTIVE",
          createdAt: new Date(),
        },
      },
      {
        tenant: { id: "tenant-2", name: "Tenant 2" },
        membership: {
          id: "mem-2",
          role: "MEMBER",
          status: "ACTIVE",
          createdAt: new Date(),
        },
      },
    ];

    mockDb.orderBy.mockResolvedValue(mockResults);

    const result = await getUserTenants("user-123");

    expect(result).toHaveLength(2);
    expect(result[0].isOwner).toBe(true);
    expect(result[0].isAdmin).toBe(true);
    expect(result[1].isOwner).toBe(false);
    expect(result[1].isAdmin).toBe(false);
  });

  it("should calculate isOwner and isAdmin correctly", async () => {
    const mockResults = [
      {
        tenant: { id: "tenant-1", name: "Tenant 1" },
        membership: {
          id: "mem-1",
          role: "ADMIN",
          status: "ACTIVE",
          createdAt: new Date(),
        },
      },
    ];

    mockDb.orderBy.mockResolvedValue(mockResults);

    const result = await getUserTenants("user-123");

    expect(result[0].isOwner).toBe(false);
    expect(result[0].isAdmin).toBe(true);
    expect(result[0].canManageMembers).toBe(true);
  });

  it("should return empty array for user without tenants", async () => {
    mockDb.orderBy.mockResolvedValue([]);

    const result = await getUserTenants("user-123");

    expect(result).toEqual([]);
  });
});

describe("requireTenantContext", () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
  };

  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(),
    innerJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const { redirect } = await import("next/navigation");
    vi.mocked(redirect).mockImplementation(() => undefined);
    const { createClient } = await import("@/shared/db/supabase/server");
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const { db } = await import("@/shared/db/drizzle/db");
    Object.assign(db, mockDb);
  });

  it("should redirect unauthenticated users", async () => {
    const { redirect } = await import("next/navigation");

    // Mock redirect to throw an error (simulating Next.js behavior)
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Not authenticated"),
    });

    await expect(requireTenantContext()).rejects.toThrow();
    expect(redirect).toHaveBeenCalledWith("/auth");
  });

  it("should redirect users without profile", async () => {
    const { redirect } = await import("next/navigation");

    // Mock redirect to throw an error (simulating Next.js behavior)
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    mockDb.limit.mockResolvedValueOnce([]);

    await expect(requireTenantContext()).rejects.toThrow();
    expect(redirect).toHaveBeenCalledWith("/auth/setup-profile");
  });

  it("should redirect users without tenants", async () => {
    const { redirect } = await import("next/navigation");

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    mockDb.limit.mockResolvedValueOnce([{ id: "user-123", fullName: "Test" }]);
    mockDb.orderBy.mockResolvedValueOnce([]);

    await requireTenantContext();

    expect(redirect).toHaveBeenCalledWith("/auth/setup-tenant");
  });

  it("should return valid context", async () => {
    const mockUser = { id: "user-123", email: "test@example.com" };
    const mockProfile = {
      id: "user-123",
      fullName: "Test User",
      currentTenantId: "tenant-1",
    };
    const mockTenant = {
      id: "tenant-1",
      name: "Test Tenant",
    };
    const mockMembership = {
      id: "mem-1",
      role: "OWNER",
      status: "ACTIVE",
      createdAt: new Date(),
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockDb.limit.mockResolvedValueOnce([mockProfile]);
    mockDb.orderBy.mockResolvedValueOnce([
      { tenant: mockTenant, membership: mockMembership },
    ]);

    const result = await requireTenantContext();

    expect(result.user.authUser).toEqual(mockUser);
    expect(result.currentTenant).toBeDefined();
    expect(result.tenants).toHaveLength(1);
  });
});

describe("switchTenant", () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
  };

  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const { createClient } = await import("@/shared/db/supabase/server");
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const { db } = await import("@/shared/db/drizzle/db");
    Object.assign(db, mockDb);
  });

  it("should switch tenant successfully", async () => {
    const mockUser = { id: "user-123", email: "test@example.com" };
    const mockMembership = {
      id: "mem-1",
      tenantId: "tenant-2",
      userId: "user-123",
      role: "MEMBER",
      status: "ACTIVE",
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockDb.limit.mockResolvedValueOnce([mockMembership]);
    mockDb.where.mockReturnThis();

    const result = await switchTenant("tenant-2");

    expect(result.success).toBe(true);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("should validate tenant access", async () => {
    const mockUser = { id: "user-123", email: "test@example.com" };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockDb.limit.mockResolvedValueOnce([]);

    await expect(switchTenant("tenant-invalid")).rejects.toThrow(
      "Access denied to this tenant"
    );
  });

  it("should handle invalid tenant ID", async () => {
    const mockUser = { id: "user-123", email: "test@example.com" };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    await expect(switchTenant("")).rejects.toThrow("tenantId is required");
  });
});
