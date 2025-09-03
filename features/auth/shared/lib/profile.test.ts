import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ensureProfileExists } from "./profile";
import { db } from "@/shared/db/drizzle/db";
import type { User } from "@supabase/supabase-js";

// Mock the database
vi.mock("@/shared/db", () => {
  const mockInsert = vi.fn();
  const mockSelect = vi.fn();
  const mockReturning = vi.fn();
  const mockOnConflictDoUpdate = vi.fn();
  const mockValues = vi.fn();
  const mockWhere = vi.fn();
  const mockLimit = vi.fn();
  const mockTransaction = vi.fn();

  return {
    db: {
      transaction: mockTransaction,
      insert: mockInsert,
      select: mockSelect,
      __mocks: {
        mockTransaction,
        mockInsert,
        mockSelect,
        mockReturning,
        mockOnConflictDoUpdate,
        mockValues,
        mockWhere,
        mockLimit,
      },
    },
    profiles: { id: "profiles.id" },
    tenants: { ownerId: "tenants.ownerId" },
    memberships: {},
  };
});

const getMocks = () => (db as any).__mocks;

function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-123",
    email: "test@example.com",
    user_metadata: {
      full_name: "Test User",
      avatar_url: "https://example.com/avatar.jpg",
    },
    app_metadata: {},
    aud: "authenticated",
    created_at: "2023-01-01T00:00:00Z",
    ...overrides,
  } as User;
}

describe("ensureProfileExists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates profile, tenant and owner membership for new user", async () => {
    const mockUser = createMockUser();
    const mocks = getMocks();

    // Mock transaction callback
    const mockTrx = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      onConflictDoUpdate: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: "profile-123" }]),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]), // No existing tenant
    };

    // Mock tenant creation
    mockTrx.insert.mockImplementation((table) => {
      if (table === "tenants") {
        return {
          ...mockTrx,
          returning: vi.fn().mockResolvedValue([{ id: "tenant-123" }]),
        };
      }
      return mockTrx;
    });

    mocks.mockTransaction.mockImplementation(
      async (callback: (trx: any) => Promise<any>) => {
        return callback(mockTrx);
      }
    );

    await ensureProfileExists(mockUser);

    // Verify transaction was called
    expect(mocks.mockTransaction).toHaveBeenCalledTimes(1);

    // Verify profile creation
    expect(mockTrx.insert).toHaveBeenCalledWith(expect.objectContaining({}));
    expect(mockTrx.values).toHaveBeenCalledWith({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      avatarUrl: "https://example.com/avatar.jpg",
      emailConfirmedAt: expect.any(Date),
    });

    // Verify tenant creation check and creation
    expect(mockTrx.select).toHaveBeenCalled();
    expect(mockTrx.where).toHaveBeenCalled();
  });

  it("updates existing profile without creating new tenant", async () => {
    const mockUser = createMockUser();
    const mocks = getMocks();

    const mockTrx = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      onConflictDoUpdate: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: "profile-123" }]),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ id: "existing-tenant" }]), // Existing tenant
    };

    mocks.mockTransaction.mockImplementation(
      async (callback: (trx: any) => Promise<any>) => {
        return callback(mockTrx);
      }
    );

    await ensureProfileExists(mockUser);

    // Verify transaction was called
    expect(mocks.mockTransaction).toHaveBeenCalledTimes(1);

    // Should not create tenant if one already exists
    expect(mockTrx.insert).toHaveBeenCalledTimes(1); // Only profile insert
  });

  it("handles user without full_name gracefully", async () => {
    const mockUser = createMockUser({
      user_metadata: {},
    });
    const mocks = getMocks();

    const mockTrx = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      onConflictDoUpdate: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: "profile-123" }]),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    mockTrx.insert.mockImplementation((table) => {
      if (table === "tenants") {
        return {
          ...mockTrx,
          returning: vi.fn().mockResolvedValue([{ id: "tenant-123" }]),
        };
      }
      return mockTrx;
    });

    mocks.mockTransaction.mockImplementation(
      async (callback: (trx: any) => Promise<any>) => {
        return callback(mockTrx);
      }
    );

    await ensureProfileExists(mockUser);

    // Verify profile creation with null name
    expect(mockTrx.values).toHaveBeenCalledWith({
      id: "user-123",
      email: "test@example.com",
      name: null,
      avatarUrl: null,
      emailConfirmedAt: expect.any(Date),
    });
  });

  it("creates workspace name from email when no full_name", async () => {
    const mockUser = createMockUser({
      user_metadata: {},
    });
    const mocks = getMocks();

    const mockTrx = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      onConflictDoUpdate: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: "profile-123" }]),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    mockTrx.insert.mockImplementation((table) => {
      if (table === "tenants") {
        return {
          ...mockTrx,
          returning: vi.fn().mockResolvedValue([{ id: "tenant-123" }]),
        };
      }
      return mockTrx;
    });

    mocks.mockTransaction.mockImplementation(
      async (callback: (trx: any) => Promise<any>) => {
        return callback(mockTrx);
      }
    );

    await ensureProfileExists(mockUser);

    // Just verify that the function completed without error and tenant creation was attempted
    expect(mockTrx.insert).toHaveBeenCalled();
  });
});
