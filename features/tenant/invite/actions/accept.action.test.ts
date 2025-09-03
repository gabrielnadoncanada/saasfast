import { describe, it, expect, vi, beforeEach } from "vitest";
import { acceptInvitationAction } from "./accept.action";

// Mock dependencies
vi.mock("@/shared/db", () => {
  const mockSelect = vi.fn();
  const mockTransaction = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockWhere = vi.fn();
  const mockLimit = vi.fn();

  return {
    db: {
      select: mockSelect,
      transaction: mockTransaction,
      insert: mockInsert,
      update: mockUpdate,
      __mocks: {
        mockSelect,
        mockTransaction,
        mockInsert,
        mockUpdate,
        mockWhere,
        mockLimit,
      },
    },
    invitations: {},
    memberships: {},
  };
});

vi.mock("@/shared/api/supabase/server", () => ({
  createClient: vi.fn().mockReturnValue({
    auth: {
      getUser: vi.fn(),
    },
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation((url) => {
    throw new Error(`NEXT_REDIRECT: ${url}`);
  }),
}));

vi.mock("@/shared/lib/redirect", () => ({
  getStatusRedirect: vi.fn().mockReturnValue("/dashboard?status=success"),
  getErrorRedirect: vi
    .fn()
    .mockImplementation(
      (path, errorKey, message) =>
        `${path}?error=${errorKey}&message=${encodeURIComponent(message)}`
    ),
}));

const { db } = await import("@/shared/db/drizzle/db");
const { createClient } = await import("@/shared/db/supabase/server");
const { redirect } = await import("next/navigation");

describe("acceptInvitationAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("successfully accepts valid invitation", async () => {
    const token = "valid-token-123";

    // Mock valid invitation
    const mockSelect = (db as any).__mocks.mockSelect;
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: "invite-123",
          tenantId: "tenant-123",
          email: "user@example.com",
          role: "MEMBER",
          expiresAt: new Date(Date.now() + 86400000), // 1 day from now
        },
      ]),
    });

    // Mock authenticated user
    const mockSupabase = (createClient as any)();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "user@example.com" } },
      error: null,
    });

    // Mock transaction
    const mockTransaction = (db as any).__mocks.mockTransaction;
    const mockTrx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]), // No existing membership
    };

    mockTransaction.mockImplementation(
      async (callback: (trx: any) => Promise<any>) => {
        return callback(mockTrx);
      }
    );

    await expect(acceptInvitationAction(token)).rejects.toThrow(
      "NEXT_REDIRECT"
    );

    expect(mockTransaction).toHaveBeenCalled();
    expect(mockTrx.insert).toHaveBeenCalled(); // New membership created
    expect(mockTrx.update).toHaveBeenCalled(); // Invitation marked as accepted
    expect(redirect).toHaveBeenCalledWith(
      expect.stringContaining("/dashboard")
    );
  });

  it("redirects to error for invalid token", async () => {
    const token = "";

    await expect(acceptInvitationAction(token)).rejects.toThrow(
      "NEXT_REDIRECT"
    );
    expect(redirect).toHaveBeenCalledWith(
      expect.stringContaining("invalid_token")
    );
  });

  it("redirects to error for expired invitation", async () => {
    const token = "expired-token";

    // Mock expired invitation (empty result)
    const mockSelect = (db as any).__mocks.mockSelect;
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]), // No valid invitation found
    });

    await expect(acceptInvitationAction(token)).rejects.toThrow(
      "NEXT_REDIRECT"
    );
    expect(redirect).toHaveBeenCalledWith(
      expect.stringContaining("invitation_not_found")
    );
  });

  it("redirects to auth for unauthenticated user", async () => {
    const token = "valid-token";

    // Mock valid invitation
    const mockSelect = (db as any).__mocks.mockSelect;
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: "invite-123",
          tenantId: "tenant-123",
          email: "user@example.com",
          role: "MEMBER",
        },
      ]),
    });

    // Mock unauthenticated user
    const mockSupabase = (createClient as any)();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Not authenticated"),
    });

    await expect(acceptInvitationAction(token)).rejects.toThrow(
      "NEXT_REDIRECT"
    );
    expect(redirect).toHaveBeenCalledWith(
      expect.stringContaining("authentication_required")
    );
  });

  it("redirects to error for email mismatch", async () => {
    const token = "valid-token";

    // Mock invitation for different email
    const mockSelect = (db as any).__mocks.mockSelect;
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: "invite-123",
          tenantId: "tenant-123",
          email: "different@example.com",
          role: "MEMBER",
        },
      ]),
    });

    // Mock user with different email
    const mockSupabase = (createClient as any)();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "user@example.com" } },
      error: null,
    });

    await expect(acceptInvitationAction(token)).rejects.toThrow(
      "NEXT_REDIRECT"
    );
    expect(redirect).toHaveBeenCalledWith(
      expect.stringContaining("email_mismatch")
    );
  });

  it("updates existing membership instead of creating new one", async () => {
    const token = "valid-token";

    // Mock valid invitation
    const mockSelect = (db as any).__mocks.mockSelect;
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: "invite-123",
          tenantId: "tenant-123",
          email: "user@example.com",
          role: "ADMIN",
        },
      ]),
    });

    // Mock authenticated user
    const mockSupabase = (createClient as any)();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "user@example.com" } },
      error: null,
    });

    // Mock transaction with existing membership
    const mockTransaction = (db as any).__mocks.mockTransaction;
    const mockTrx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ id: "existing-membership" }]), // Existing membership
    };

    mockTransaction.mockImplementation(
      async (callback: (trx: any) => Promise<any>) => {
        return callback(mockTrx);
      }
    );

    await expect(acceptInvitationAction(token)).rejects.toThrow(
      "NEXT_REDIRECT"
    );

    expect(mockTransaction).toHaveBeenCalled();
    expect(mockTrx.update).toHaveBeenCalledTimes(2); // Update membership + mark invitation accepted
  });

  it("handles database transaction errors", async () => {
    const token = "valid-token";

    // Mock valid invitation
    const mockSelect = (db as any).__mocks.mockSelect;
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: "invite-123",
          tenantId: "tenant-123",
          email: "user@example.com",
          role: "MEMBER",
        },
      ]),
    });

    // Mock authenticated user
    const mockSupabase = (createClient as any)();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "user@example.com" } },
      error: null,
    });

    // Mock transaction failure
    const mockTransaction = (db as any).__mocks.mockTransaction;
    mockTransaction.mockRejectedValue(new Error("Transaction failed"));

    await expect(acceptInvitationAction(token)).rejects.toThrow(
      "NEXT_REDIRECT"
    );
    expect(redirect).toHaveBeenCalledWith(
      expect.stringContaining("invitation_accept_error")
    );
  });
});
