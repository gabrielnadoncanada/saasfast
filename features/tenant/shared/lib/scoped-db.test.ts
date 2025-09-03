import { describe, it, expect, vi, beforeEach } from "vitest";
import { ScopedDatabase, getScopedDb, withScopedDb } from "./scoped-db";
import { getCurrentUserTenantContext, requireTenantContext } from "./context";

// Mock dependencies
vi.mock("./context", () => ({
  getCurrentUserTenantContext: vi.fn(),
  requireTenantContext: vi.fn(),
}));

vi.mock("@/shared/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockContext = {
  user: { 
    id: "user-123",
    email: "test@example.com",
    aud: "authenticated" as const,
    created_at: "2023-01-01T00:00:00Z",
    app_metadata: {},
    user_metadata: {},
  },
  tenant: { 
    id: "tenant-123",
    name: "Test Tenant",
    ownerId: "user-123",
    stripeCustomerId: null,
    plan: "FREE" as const,
    createdAt: new Date(),
    deletedAt: null,
  },
  membership: { 
    id: "membership-123",
    userId: "user-123",
    tenantId: "tenant-123",
    role: "OWNER" as const,
    status: "ACTIVE" as const,
    createdAt: new Date(),
  },
  role: "OWNER" as const,
};

describe("ScopedDatabase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor and basic properties", () => {
    it("initializes with tenant context", () => {
      const scopedDb = new ScopedDatabase(mockContext);

      expect(scopedDb.tenantId).toBe("tenant-123");
      expect(scopedDb.userId).toBe("user-123");
      expect(scopedDb.userRole).toBe("OWNER");
    });

    it("provides access to underlying db", () => {
      const scopedDb = new ScopedDatabase(mockContext);

      expect(scopedDb.db).toBeDefined();
    });
  });

  describe("role checking methods", () => {
    it("identifies admin roles correctly", () => {
      const ownerDb = new ScopedDatabase({
        ...mockContext,
        membership: { ...mockContext.membership, role: "OWNER" },
      });
      const adminDb = new ScopedDatabase({
        ...mockContext,
        membership: { ...mockContext.membership, role: "ADMIN" },
      });
      const memberDb = new ScopedDatabase({
        ...mockContext,
        membership: { ...mockContext.membership, role: "MEMBER" },
      });

      expect(ownerDb.isAdmin()).toBe(true);
      expect(adminDb.isAdmin()).toBe(true);
      expect(memberDb.isAdmin()).toBe(false);
    });

    it("identifies owner role correctly", () => {
      const ownerDb = new ScopedDatabase({
        ...mockContext,
        membership: { ...mockContext.membership, role: "OWNER" },
      });
      const adminDb = new ScopedDatabase({
        ...mockContext,
        membership: { ...mockContext.membership, role: "ADMIN" },
      });

      expect(ownerDb.isOwner()).toBe(true);
      expect(adminDb.isOwner()).toBe(false);
    });

    it("requireAdmin throws for non-admin", () => {
      const memberDb = new ScopedDatabase({
        ...mockContext,
        membership: { ...mockContext.membership, role: "MEMBER" },
      });

      expect(() => memberDb.requireAdmin()).toThrow("Admin privileges required");
    });

    it("requireAdmin passes for admin", () => {
      const adminDb = new ScopedDatabase({
        ...mockContext,
        membership: { ...mockContext.membership, role: "ADMIN" },
      });

      expect(() => adminDb.requireAdmin()).not.toThrow();
    });

    it("requireOwner throws for non-owner", () => {
      const adminDb = new ScopedDatabase({
        ...mockContext,
        membership: { ...mockContext.membership, role: "ADMIN" },
      });

      expect(() => adminDb.requireOwner()).toThrow("Owner privileges required");
    });

    it("requireOwner passes for owner", () => {
      const ownerDb = new ScopedDatabase({
        ...mockContext,
        membership: { role: "OWNER" },
      });

      expect(() => ownerDb.requireOwner()).not.toThrow();
    });
  });
});

describe("getScopedDb", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates ScopedDatabase with user context", async () => {
    (getCurrentUserTenantContext as any).mockResolvedValue(mockContext);
    (requireTenantContext as any).mockImplementation(() => {});

    const scopedDb = await getScopedDb();

    expect(scopedDb).toBeInstanceOf(ScopedDatabase);
    expect(scopedDb.tenantId).toBe("tenant-123");
    expect(getCurrentUserTenantContext).toHaveBeenCalled();
    expect(requireTenantContext).toHaveBeenCalledWith(mockContext);
  });

  it("throws when context is null", async () => {
    (getCurrentUserTenantContext as any).mockResolvedValue(null);
    (requireTenantContext as any).mockImplementation((context) => {
      if (!context) throw new Error("User must be authenticated");
    });

    await expect(getScopedDb()).rejects.toThrow("User must be authenticated");
  });
});

describe("withScopedDb", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("executes function with scoped database", async () => {
    (getCurrentUserTenantContext as any).mockResolvedValue(mockContext);
    (requireTenantContext as any).mockImplementation(() => {});

    const mockFn = vi.fn().mockResolvedValue("result");

    const result = await withScopedDb(mockFn);

    expect(result).toBe("result");
    expect(mockFn).toHaveBeenCalledWith(expect.any(ScopedDatabase));
    expect(mockFn.mock.calls[0][0].tenantId).toBe("tenant-123");
  });

  it("propagates errors from the function", async () => {
    (getCurrentUserTenantContext as any).mockResolvedValue(mockContext);
    (requireTenantContext as any).mockImplementation(() => {});

    const mockFn = vi.fn().mockRejectedValue(new Error("Database error"));

    await expect(withScopedDb(mockFn)).rejects.toThrow("Database error");
  });

  it("propagates errors from context setup", async () => {
    (getCurrentUserTenantContext as any).mockRejectedValue(new Error("Auth error"));

    const mockFn = vi.fn();

    await expect(withScopedDb(mockFn)).rejects.toThrow("Auth error");
    expect(mockFn).not.toHaveBeenCalled();
  });
});