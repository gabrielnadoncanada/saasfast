import { describe, it, expect, vi, beforeEach } from "vitest";
import { inviteMemberAction } from "./invite.action";
import { safeParseForm } from "@/shared/lib/safeParseForm";

// Mock crypto module
vi.mock("crypto", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: {
      ...actual.default,
      randomBytes: vi.fn(() => ({
        toString: vi.fn(() => "mock-token-123"),
      })),
    },
    randomBytes: vi.fn(() => ({
      toString: vi.fn(() => "mock-token-123"),
    })),
  };
});

// Mock dependencies
vi.mock("@/shared/lib/safeParseForm", () => ({
  safeParseForm: vi.fn(),
}));

vi.mock("@/features/tenant/shared/lib/context", () => ({
  getCurrentUserTenantContext: vi.fn(),
  requireTenantContext: vi.fn(),
}));

vi.mock("@/features/tenant/shared/lib/tenant", () => ({
  isUserOwnerOrAdmin: vi.fn(),
}));

vi.mock("@/shared/db", () => {
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockWhere = vi.fn();
  const mockLimit = vi.fn();
  const mockSet = vi.fn();
  const mockValues = vi.fn();

  return {
    db: {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      __mocks: {
        mockSelect,
        mockInsert,
        mockUpdate,
        mockWhere,
        mockLimit,
        mockSet,
        mockValues,
      },
    },
    invitations: {},
  };
});

vi.mock("crypto", () => ({
  randomBytes: vi.fn().mockReturnValue({
    toString: vi.fn().mockReturnValue("mock-secure-token"),
  }),
}));

const { getCurrentUserTenantContext, requireTenantContext } = await import(
  "@/features/tenant/shared/lib/context"
);
const { isUserOwnerOrAdmin } = await import(
  "@/features/tenant/shared/lib/tenant"
);
const { db } = await import("@/shared/db/drizzle/db");

function createFormData(email: string, role: string): FormData {
  const formData = new FormData();
  formData.append("email", email);
  formData.append("role", role);
  return formData;
}

describe("inviteMemberAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for context
    (getCurrentUserTenantContext as any).mockResolvedValue({
      user: { id: "owner-123" },
      tenant: { id: "tenant-123" },
      membership: { role: "OWNER" },
    });

    (requireTenantContext as any).mockImplementation(() => {});
    (isUserOwnerOrAdmin as any).mockResolvedValue(true);
  });

  it("successfully creates new invitation", async () => {
    const formData = createFormData("new@example.com", "MEMBER");

    (safeParseForm as any).mockResolvedValue({
      success: true,
      data: { email: "new@example.com", role: "MEMBER" },
    });

    // Mock no existing invitation
    const mockSelect = (db as any).__mocks.mockSelect;
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]), // No existing invitation
    });

    // Mock successful insertion
    const mockInsert = (db as any).__mocks.mockInsert;
    mockInsert.mockReturnValue({
      values: vi.fn().mockResolvedValue({}),
    });

    const result = await inviteMemberAction(formData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        email: "new@example.com",
        role: "MEMBER",
      });
    }
    expect(mockInsert).toHaveBeenCalled();
  });

  it("updates existing invitation (idempotent)", async () => {
    const formData = createFormData("existing@example.com", "ADMIN");

    (safeParseForm as any).mockResolvedValue({
      success: true,
      data: { email: "existing@example.com", role: "ADMIN" },
    });

    // Mock existing invitation
    const mockSelect = (db as any).__mocks.mockSelect;
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ id: "existing-invite-123" }]),
    });

    // Mock successful update
    const mockUpdate = (db as any).__mocks.mockUpdate;
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue({}),
    });

    const result = await inviteMemberAction(formData);

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("rejects invitation from non-admin user", async () => {
    const formData = createFormData("test@example.com", "MEMBER");

    (safeParseForm as any).mockResolvedValue({
      success: true,
      data: { email: "test@example.com", role: "MEMBER" },
    });

    (isUserOwnerOrAdmin as any).mockResolvedValue(false);

    const result = await inviteMemberAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("permissions");
    }
  });

  it("validates email format", async () => {
    const formData = createFormData("invalid-email", "MEMBER");

    (safeParseForm as any).mockResolvedValue({
      success: false,
      error: "Email invalide",
      fieldErrors: { email: ["Email invalide"] },
    });

    const result = await inviteMemberAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Email invalide");
    }
  });

  it("validates role enum", async () => {
    const formData = createFormData("test@example.com", "INVALID_ROLE");

    (safeParseForm as any).mockResolvedValue({
      success: false,
      error: "Rôle invalide",
      fieldErrors: { role: ["Rôle invalide"] },
    });

    const result = await inviteMemberAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Rôle invalide");
    }
  });

  it("prevents inviting as OWNER role", async () => {
    const formData = createFormData("test@example.com", "OWNER");

    (safeParseForm as any).mockResolvedValue({
      success: false,
      error: "Rôle invalide",
      fieldErrors: { role: ["Invalid enum value"] },
    });

    const result = await inviteMemberAction(formData);

    expect(result.success).toBe(false);
  });

  it("handles database errors gracefully", async () => {
    const formData = createFormData("test@example.com", "MEMBER");

    (safeParseForm as any).mockResolvedValue({
      success: true,
      data: { email: "test@example.com", role: "MEMBER" },
    });

    // Mock database error
    const mockSelect = (db as any).__mocks.mockSelect;
    mockSelect.mockImplementation(() => {
      throw new Error("Database connection failed");
    });

    const result = await inviteMemberAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Erreur lors de l'envoi");
    }
  });
});
