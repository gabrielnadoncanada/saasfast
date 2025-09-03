import { describe, it, expect, vi, beforeEach } from "vitest";
import { withTenantScope } from "./queries";
import { ScopedDatabase } from "./scoped-db";
import { eq, and } from "drizzle-orm";

// Mock drizzle-orm functions
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
}));

describe("withTenantScope", () => {
  let mockScopedDb: ScopedDatabase;
  let mockTenantIdColumn: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock ScopedDatabase
    mockScopedDb = {
      tenantId: "tenant-123",
      userId: "user-123",
      userRole: "OWNER",
      db: {} as any,
      isAdmin: vi.fn().mockReturnValue(true),
      isOwner: vi.fn().mockReturnValue(true),
      requireAdmin: vi.fn(),
      requireOwner: vi.fn(),
    };

    // Mock PgColumn
    mockTenantIdColumn = {
      name: "tenantId",
      table: "testTable",
    };

    // Mock drizzle functions
    (eq as any).mockReturnValue("eq-condition");
    (and as any).mockReturnValue("and-condition");
  });

  it("creates tenant scope condition", () => {
    const result = withTenantScope(mockScopedDb, mockTenantIdColumn);

    expect(eq).toHaveBeenCalledWith(mockTenantIdColumn, "tenant-123");
    expect(result).toBe("eq-condition");
  });

  it("combines tenant scope with additional condition", () => {
    const additionalWhere = "additional-condition";

    const result = withTenantScope(mockScopedDb, mockTenantIdColumn, additionalWhere as any);

    expect(eq).toHaveBeenCalledWith(mockTenantIdColumn, "tenant-123");
    expect(and).toHaveBeenCalledWith("eq-condition", additionalWhere);
    expect(result).toBe("and-condition");
  });

  it("returns only tenant condition when no additional condition", () => {
    const result = withTenantScope(mockScopedDb, mockTenantIdColumn, undefined);

    expect(eq).toHaveBeenCalledWith(mockTenantIdColumn, "tenant-123");
    expect(and).not.toHaveBeenCalled();
    expect(result).toBe("eq-condition");
  });

  it("works with different tenant IDs", () => {
    const differentScopedDb = {
      ...mockScopedDb,
      tenantId: "different-tenant-456",
    };

    withTenantScope(differentScopedDb, mockTenantIdColumn);

    expect(eq).toHaveBeenCalledWith(mockTenantIdColumn, "different-tenant-456");
  });

  it("preserves original additional condition", () => {
    const complexCondition = { complex: "condition", nested: { value: true } };

    withTenantScope(mockScopedDb, mockTenantIdColumn, complexCondition as any);

    expect(and).toHaveBeenCalledWith("eq-condition", complexCondition);
  });
});