import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTenantAction } from "@/features/tenant/create/actions/createTenant.action";

// Valid UUIDs for testing
const VALID_USER_UUID = "550e8400-e29b-41d4-a716-446655440001";
const VALID_TENANT_UUID = "550e8400-e29b-41d4-a716-446655440010";

// Mock dependencies
vi.mock("@/shared/db/drizzle/db", () => ({
  db: {
    transaction: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
  tenants: {},
  memberships: {},
  profiles: {},
}));

vi.mock("@/features/auth/shared/actions/getUserTenantData.action", () => ({
  requireTenantContext: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("createTenantAction", () => {
  const mockTransaction = vi.fn();
  const mockInsert = vi.fn().mockReturnThis();
  const mockValues = vi.fn().mockReturnThis();
  const mockReturning = vi.fn();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockSet = vi.fn().mockReturnThis();
  const mockWhere = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();

    const { db } = await import("@/shared/db/drizzle/db");
    vi.mocked(db.transaction).mockImplementation(mockTransaction);

    const { requireTenantContext } = await import(
      "@/features/auth/shared/actions/getUserTenantData.action"
    );
    vi.mocked(requireTenantContext).mockResolvedValue({
      user: {
        authUser: { id: VALID_USER_UUID, email: "test@example.com" },
        profile: { id: VALID_USER_UUID, fullName: "Test User", currentTenantId: null },
      },
      currentTenant: null,
      tenants: [],
    } as any);
  });

  it("should create tenant successfully", async () => {
    const mockTenant = { id: VALID_TENANT_UUID, name: "New Tenant", ownerId: VALID_USER_UUID };

    mockTransaction.mockImplementation(async (callback) => {
      const trx = {
        insert: () => ({
          values: () => ({
            returning: () => Promise.resolve([mockTenant]),
          }),
        }),
        update: () => ({
          set: () => ({
            where: () => Promise.resolve(),
          }),
        }),
      };
      return callback(trx);
    });

    const formData = new FormData();
    formData.append("name", "New Tenant");

    const result = await createTenantAction(formData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: "New Tenant" });
    }
  });

  it("should validate tenant name", async () => {
    const formData = new FormData();
    formData.append("name", "");

    const result = await createTenantAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors).toBeDefined();
    }
  });

  it("should require authenticated user", async () => {
    const { requireTenantContext } = await import(
      "@/features/auth/shared/actions/getUserTenantData.action"
    );
    vi.mocked(requireTenantContext).mockResolvedValue({
      user: null,
      currentTenant: null,
      tenants: [],
    } as any);

    const formData = new FormData();
    formData.append("name", "New Tenant");

    const result = await createTenantAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Utilisateur non authentifié.");
    }
  });

  it("should create owner membership", async () => {
    const mockInsertMembership = vi.fn();
    const mockTenant = { id: VALID_TENANT_UUID, name: "New Tenant" };

    mockTransaction.mockImplementation(async (callback) => {
      const trx = {
        insert: (table: any) => ({
          values: (data: any) => {
            if (data.role === "OWNER") {
              mockInsertMembership(data);
            }
            return {
              returning: () => Promise.resolve([mockTenant]),
            };
          },
        }),
        update: () => ({
          set: () => ({
            where: () => Promise.resolve(),
          }),
        }),
      };
      return callback(trx);
    });

    const formData = new FormData();
    formData.append("name", "New Tenant");

    await createTenantAction(formData);

    expect(mockInsertMembership).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "OWNER",
        status: "ACTIVE",
      })
    );
  });

  it("should update user current tenant", async () => {
    const mockUpdateProfile = vi.fn();
    const mockTenant = { id: VALID_TENANT_UUID, name: "New Tenant" };

    mockTransaction.mockImplementation(async (callback) => {
      const trx = {
        insert: () => ({
          values: () => ({
            returning: () => Promise.resolve([mockTenant]),
          }),
        }),
        update: () => ({
          set: (data: any) => {
            mockUpdateProfile(data);
            return {
              where: () => Promise.resolve(),
            };
          },
        }),
      };
      return callback(trx);
    });

    const formData = new FormData();
    formData.append("name", "New Tenant");

    await createTenantAction(formData);

    expect(mockUpdateProfile).toHaveBeenCalledWith({
      currentTenantId: VALID_TENANT_UUID,
    });
  });

  it("should handle database errors", async () => {
    mockTransaction.mockRejectedValue(new Error("Database error"));

    const formData = new FormData();
    formData.append("name", "New Tenant");

    const result = await createTenantAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        "Erreur lors de la création du workspace. Veuillez réessayer."
      );
    }
  });
});
