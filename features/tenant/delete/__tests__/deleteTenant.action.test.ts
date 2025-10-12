import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteTenantAction } from "@/features/tenant/delete/actions/deleteTenant.action";

// Valid UUIDs for testing
const VALID_USER_UUID = "550e8400-e29b-41d4-a716-446655440001";
const VALID_TENANT_UUID_1 = "550e8400-e29b-41d4-a716-446655440010";
const VALID_TENANT_UUID_2 = "550e8400-e29b-41d4-a716-446655440011";

// Mock dependencies
vi.mock("@/shared/db/drizzle/db", () => ({
  db: {
    select: vi.fn(),
    transaction: vi.fn(),
    update: vi.fn(),
  },
  tenants: {},
  memberships: {},
  profiles: {},
}));

vi.mock("@/features/auth/shared/actions/getUserTenantData.action", () => ({
  requireTenantContext: vi.fn(),
}));

vi.mock("@/features/tenant/shared/lib/tenant", () => ({
  isUserOwner: vi.fn(),
}));

describe("deleteTenantAction", () => {
  const mockContext = {
    user: {
      authUser: { id: VALID_USER_UUID, email: "test@example.com" },
      profile: { id: VALID_USER_UUID, fullName: "Test User", currentTenantId: VALID_TENANT_UUID_1 },
    },
    currentTenant: {
      tenant: { id: VALID_TENANT_UUID_1, name: "Current Tenant" },
      isOwner: true,
    },
    tenants: [],
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const { requireTenantContext } = await import(
      "@/features/auth/shared/actions/getUserTenantData.action"
    );
    vi.mocked(requireTenantContext).mockResolvedValue(mockContext as any);

    const { isUserOwner } = await import("@/features/tenant/shared/lib/tenant");
    vi.mocked(isUserOwner).mockResolvedValue(true);
  });

  it("should delete tenant successfully", async () => {
    const { db } = await import("@/shared/db/drizzle/db");

    // Mock query pour vérifier les tenants possédés
    const mockSelect = vi.fn().mockReturnThis();
    const mockFrom = vi.fn().mockReturnThis();
    const mockInnerJoin = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockResolvedValue([
      { id: VALID_TENANT_UUID_1 },
      { id: VALID_TENANT_UUID_2 },
    ]);

    mockSelect.mockReturnValue({ from: mockFrom } as any);
    mockFrom.mockReturnValue({ innerJoin: mockInnerJoin } as any);
    mockInnerJoin.mockReturnValue({ where: mockWhere } as any);
    vi.mocked(db.select).mockReturnValue(mockSelect() as any);

    // Mock transaction
    vi.mocked(db.transaction).mockImplementation(async (callback) => {
      const trx = {
        update: () => ({
          set: () => ({
            where: () => Promise.resolve(),
          }),
        }),
        select: () => ({
          from: () => ({
            innerJoin: () => ({
              where: () => ({
                limit: () => Promise.resolve([{ id: VALID_TENANT_UUID_2 }]),
              }),
            }),
          }),
        }),
      };
      return callback(trx as any);
    });

    const formData = new FormData();
    formData.append("tenantId", VALID_TENANT_UUID_1);

    const result = await deleteTenantAction(formData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ tenantId: VALID_TENANT_UUID_1 });
    }
  });

  it("should require owner permission", async () => {
    const { isUserOwner } = await import("@/features/tenant/shared/lib/tenant");
    vi.mocked(isUserOwner).mockResolvedValue(false);

    const formData = new FormData();
    formData.append("tenantId", VALID_TENANT_UUID_1);

    const result = await deleteTenantAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        "Vous devez être propriétaire du workspace pour le supprimer."
      );
    }
  });

  it("should prevent deleting last tenant", async () => {
    const { db } = await import("@/shared/db/drizzle/db");

    // Mock query pour retourner un seul tenant
    const mockSelect = vi.fn().mockReturnThis();
    const mockFrom = vi.fn().mockReturnThis();
    const mockInnerJoin = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockResolvedValue([{ id: VALID_TENANT_UUID_1 }]);

    mockSelect.mockReturnValue({ from: mockFrom } as any);
    mockFrom.mockReturnValue({ innerJoin: mockInnerJoin } as any);
    mockInnerJoin.mockReturnValue({ where: mockWhere } as any);
    vi.mocked(db.select).mockReturnValue(mockSelect() as any);

    const formData = new FormData();
    formData.append("tenantId", VALID_TENANT_UUID_1);

    const result = await deleteTenantAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("dernier workspace");
    }
  });

  it("should soft delete tenant", async () => {
    const { db } = await import("@/shared/db/drizzle/db");
    const mockUpdate = vi.fn();

    // Mock query pour vérifier les tenants
    const mockSelect = vi.fn().mockReturnThis();
    const mockFrom = vi.fn().mockReturnThis();
    const mockInnerJoin = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockResolvedValue([
      { id: VALID_TENANT_UUID_1 },
      { id: VALID_TENANT_UUID_2 },
    ]);

    mockSelect.mockReturnValue({ from: mockFrom } as any);
    mockFrom.mockReturnValue({ innerJoin: mockInnerJoin } as any);
    mockInnerJoin.mockReturnValue({ where: mockWhere } as any);
    vi.mocked(db.select).mockReturnValue(mockSelect() as any);

    // Mock transaction pour capturer les updates
    vi.mocked(db.transaction).mockImplementation(async (callback) => {
      const trx = {
        update: () => {
          mockUpdate();
          return {
            set: (data: any) => ({
              where: () => {
                if (data.deletedAt) {
                  // C'est le soft delete
                  expect(data.deletedAt).toBeInstanceOf(Date);
                }
                return Promise.resolve();
              },
            }),
          };
        },
        select: () => ({
          from: () => ({
            innerJoin: () => ({
              where: () => ({
                limit: () => Promise.resolve([{ id: VALID_TENANT_UUID_2 }]),
              }),
            }),
          }),
        }),
      };
      return callback(trx as any);
    });

    const formData = new FormData();
    formData.append("tenantId", VALID_TENANT_UUID_1);

    await deleteTenantAction(formData);

    expect(mockUpdate).toHaveBeenCalled();
  });

  it("should switch current tenant if needed", async () => {
    const { db } = await import("@/shared/db/drizzle/db");
    const mockUpdateProfile = vi.fn();

    // Mock query
    const mockSelect = vi.fn().mockReturnThis();
    const mockFrom = vi.fn().mockReturnThis();
    const mockInnerJoin = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockResolvedValue([
      { id: VALID_TENANT_UUID_1 },
      { id: VALID_TENANT_UUID_2 },
    ]);

    mockSelect.mockReturnValue({ from: mockFrom } as any);
    mockFrom.mockReturnValue({ innerJoin: mockInnerJoin } as any);
    mockInnerJoin.mockReturnValue({ where: mockWhere } as any);
    vi.mocked(db.select).mockReturnValue(mockSelect() as any);

    // Mock transaction
    vi.mocked(db.transaction).mockImplementation(async (callback) => {
      const trx = {
        update: () => ({
          set: (data: any) => {
            if (data.currentTenantId) {
              mockUpdateProfile(data);
            }
            return {
              where: () => Promise.resolve(),
            };
          },
        }),
        select: () => ({
          from: () => ({
            innerJoin: () => ({
              where: () => ({
                limit: () => Promise.resolve([{ id: VALID_TENANT_UUID_2 }]),
              }),
            }),
          }),
        }),
      };
      return callback(trx as any);
    });

    const formData = new FormData();
    formData.append("tenantId", VALID_TENANT_UUID_1);

    await deleteTenantAction(formData);

    expect(mockUpdateProfile).toHaveBeenCalledWith({
      currentTenantId: VALID_TENANT_UUID_2,
    });
  });

  it("should handle database errors", async () => {
    const { db } = await import("@/shared/db/drizzle/db");

    vi.mocked(db.select).mockImplementation(() => {
      throw new Error("Database error");
    });

    const formData = new FormData();
    formData.append("tenantId", VALID_TENANT_UUID_1);

    const result = await deleteTenantAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Erreur lors de la suppression");
    }
  });
});
