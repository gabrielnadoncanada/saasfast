import { describe, it, expect, vi, beforeEach } from "vitest";
import { acceptInvitationAction } from "@/features/tenant/invite/actions/accept.action";

// Valid UUIDs for testing
const VALID_USER_UUID = "550e8400-e29b-41d4-a716-446655440001";
const VALID_TENANT_UUID = "550e8400-e29b-41d4-a716-446655440010";
const VALID_INVITE_UUID = "550e8400-e29b-41d4-a716-446655440020";

// Mock dependencies
vi.mock("@/shared/db/drizzle/db", () => ({
  db: {
    select: vi.fn(),
    transaction: vi.fn(),
  },
  invitations: {},
  memberships: {},
  profiles: {},
}));

vi.mock("@/shared/db/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/shared/lib/redirect", () => ({
  getErrorRedirect: vi.fn((path, key, message) => `${path}?error=${key}`),
  getStatusRedirect: vi.fn((path, title, desc) => `${path}?status=success`),
}));

describe("acceptInvitationAction", () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
  };

  const mockInvitation = {
    id: VALID_INVITE_UUID,
    tenantId: VALID_TENANT_UUID,
    email: "user@example.com",
    role: "MEMBER",
    token: "valid-token",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    acceptedAt: null,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const { createClient } = await import("@/shared/db/supabase/server");
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  it("should accept valid invitation", async () => {
    const { db } = await import("@/shared/db/drizzle/db");
    const { redirect } = await import("next/navigation");

    // Mock invitation query - properly chain the methods
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockInvitation]),
        }),
      }),
    } as any);

    // Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_USER_UUID, email: "user@example.com" } },
      error: null,
    });

    // Mock transaction
    vi.mocked(db.transaction).mockImplementation(async (callback) => {
      const trx = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([]),
            }),
          }),
        }),
        insert: () => ({
          values: () => Promise.resolve(),
        }),
        update: () => ({
          set: () => ({
            where: () => Promise.resolve(),
          }),
        }),
      };
      return callback(trx as any);
    });

    await acceptInvitationAction("valid-token");

    expect(redirect).toHaveBeenCalledWith(expect.stringContaining("/dashboard"));
  });

  it("should reject expired invitation", async () => {
    const { db } = await import("@/shared/db/drizzle/db");
    const { redirect } = await import("next/navigation");

    // Mock no invitations found (expired)
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as any);

    await acceptInvitationAction("expired-token");

    expect(redirect).toHaveBeenCalledWith(expect.stringContaining("invitation_not_found"));
  });

  it("should require authentication", async () => {
    const { db } = await import("@/shared/db/drizzle/db");
    const { redirect } = await import("next/navigation");

    // Mock invitation found
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockInvitation]),
        }),
      }),
    } as any);

    // Mock unauthenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Not authenticated"),
    });

    await acceptInvitationAction("valid-token");

    expect(redirect).toHaveBeenCalledWith(
      expect.stringContaining("authentication_required")
    );
  });

  it("should validate email match", async () => {
    const { db } = await import("@/shared/db/drizzle/db");
    const { redirect } = await import("next/navigation");

    // Mock invitation found
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockInvitation]),
        }),
      }),
    } as any);

    // Mock authenticated user with different email
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "different@example.com" } },
      error: null,
    });

    await acceptInvitationAction("valid-token");

    expect(redirect).toHaveBeenCalledWith(expect.stringContaining("email_mismatch"));
  });

  it("should create membership", async () => {
    const { db } = await import("@/shared/db/drizzle/db");
    const mockInsert = vi.fn();

    // Mock invitation query
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockInvitation]),
        }),
      }),
    } as any);

    // Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_USER_UUID, email: "user@example.com" } },
      error: null,
    });

    // Mock transaction
    vi.mocked(db.transaction).mockImplementation(async (callback) => {
      const trx = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([]),
            }),
          }),
        }),
        insert: () => {
          mockInsert();
          return {
            values: (data: any) => {
              expect(data).toMatchObject({
                userId: VALID_USER_UUID,
                tenantId: VALID_TENANT_UUID,
                role: "MEMBER",
                status: "ACTIVE",
              });
              return Promise.resolve();
            },
          };
        },
        update: () => ({
          set: () => ({
            where: () => Promise.resolve(),
          }),
        }),
      };
      return callback(trx as any);
    });

    await acceptInvitationAction("valid-token");

    expect(mockInsert).toHaveBeenCalled();
  });
});
