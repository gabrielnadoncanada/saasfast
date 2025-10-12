import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateAccountSettingsAction } from "@/features/account/settings/actions/updateAccountSettings.action";

// Valid UUIDs for testing
const VALID_USER_UUID = "550e8400-e29b-41d4-a716-446655440001";

// Helper to create File with arrayBuffer support for Node.js environment
function createMockFile(content: string[], name: string, options: FilePropertyBag) {
  const file = new File(content, name, options);
  // Add arrayBuffer method for Node.js environment
  (file as any).arrayBuffer = vi.fn().mockResolvedValue(
    new ArrayBuffer(content.join('').length)
  );
  return file;
}

// Mock dependencies
vi.mock("@/shared/db/drizzle/db", () => ({
  db: {
    update: vi.fn(),
  },
  profiles: {},
}));

vi.mock("@/shared/db/drizzle/auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/shared/db/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/shared/lib/redirect", () => ({
  getStatusRedirect: vi.fn((path, title, desc) => `${path}?status=success`),
}));

describe("updateAccountSettingsAction", () => {
  const mockSupabase = {
    storage: {
      from: vi.fn(),
    },
  };

  const mockCurrentUser = {
    authUser: { id: VALID_USER_UUID, email: "test@example.com" },
    profile: {
      id: VALID_USER_UUID,
      name: "Test User",
      avatarUrl: null,
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const { requireAuth } = await import("@/shared/db/drizzle/auth");
    vi.mocked(requireAuth).mockResolvedValue(mockCurrentUser as any);

    const { createClient } = await import("@/shared/db/supabase/server");
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  it("should update account name successfully", async () => {
    const { db } = await import("@/shared/db/drizzle/db");

    const mockSet = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockResolvedValue(undefined);

    vi.mocked(db.update).mockReturnValue({
      set: mockSet,
    } as any);
    mockSet.mockReturnValue({ where: mockWhere } as any);

    const formData = new FormData();
    formData.append("name", "New Name");

    const result = await updateAccountSettingsAction(formData);

    expect(result.success).toBe(true);
    expect(mockSet).toHaveBeenCalledWith({ name: "New Name" });
  });

  it("should upload avatar to storage", async () => {
    const { db } = await import("@/shared/db/drizzle/db");

    const mockFile = createMockFile(["avatar"], "avatar.png", { type: "image/png" });
    const mockUpload = vi.fn().mockResolvedValue({
      data: { path: "public/user-123-123456.png" },
      error: null,
    });
    const mockGetPublicUrl = vi.fn().mockReturnValue({
      data: { publicUrl: "https://example.com/avatar.png" },
    });

    mockSupabase.storage.from.mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
      remove: vi.fn(),
    });

    const mockSet = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockResolvedValue(undefined);

    vi.mocked(db.update).mockReturnValue({
      set: mockSet,
    } as any);
    mockSet.mockReturnValue({ where: mockWhere } as any);

    const formData = new FormData();
    formData.append("name", "New Name");
    formData.append("avatar", mockFile);

    const result = await updateAccountSettingsAction(formData);

    expect(result.success).toBe(true);
    expect(mockUpload).toHaveBeenCalled();
  });

  it("should validate file type and size", async () => {
    // Test invalid file type
    const invalidFile = new File(["text"], "file.txt", { type: "text/plain" });

    const formData1 = new FormData();
    formData1.append("name", "New Name");
    formData1.append("avatar", invalidFile);

    const result1 = await updateAccountSettingsAction(formData1);

    expect(result1.success).toBe(false);
    if (!result1.success) {
      expect(result1.error).toContain("image");
    }

    // Test file too large (2MB > 1MB limit)
    const largeFile = new File([new ArrayBuffer(2 * 1024 * 1024)], "large.png", {
      type: "image/png",
    });

    const formData2 = new FormData();
    formData2.append("name", "New Name");
    formData2.append("avatar", largeFile);

    const result2 = await updateAccountSettingsAction(formData2);

    expect(result2.success).toBe(false);
    if (!result2.success) {
      expect(result2.error).toContain("1MB");
    }
  });

  it("should delete old avatar", async () => {
    const { requireAuth } = await import("@/shared/db/drizzle/auth");
    const { db } = await import("@/shared/db/drizzle/db");

    vi.mocked(requireAuth).mockResolvedValue({
      ...mockCurrentUser,
      profile: {
        ...mockCurrentUser.profile,
        avatarUrl: "https://supabase.example.com/storage/v1/object/public/avatars/old-avatar.png",
      },
    } as any);

    const mockRemove = vi.fn().mockResolvedValue({ error: null });
    const mockUpload = vi.fn().mockResolvedValue({
      data: { path: "public/user-123-123456.png" },
      error: null,
    });
    const mockGetPublicUrl = vi.fn().mockReturnValue({
      data: { publicUrl: "https://example.com/new-avatar.png" },
    });

    mockSupabase.storage.from.mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
      remove: mockRemove,
    });

    const mockSet = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockResolvedValue(undefined);

    vi.mocked(db.update).mockReturnValue({
      set: mockSet,
    } as any);
    mockSet.mockReturnValue({ where: mockWhere } as any);

    const mockFile = createMockFile(["avatar"], "new-avatar.png", { type: "image/png" });

    const formData = new FormData();
    formData.append("name", "New Name");
    formData.append("avatar", mockFile);

    await updateAccountSettingsAction(formData);

    expect(mockRemove).toHaveBeenCalledWith(["old-avatar.png"]);
  });

  it("should handle upload errors", async () => {
    const mockUpload = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Upload failed" },
    });

    mockSupabase.storage.from.mockReturnValue({
      upload: mockUpload,
    });

    const mockFile = createMockFile(["avatar"], "avatar.png", { type: "image/png" });

    const formData = new FormData();
    formData.append("name", "New Name");
    formData.append("avatar", mockFile);

    const result = await updateAccountSettingsAction(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("téléchargement");
    }
  });

  it("should require authentication", async () => {
    const { requireAuth } = await import("@/shared/db/drizzle/auth");

    vi.mocked(requireAuth).mockRejectedValue(new Error("Not authenticated"));

    const formData = new FormData();
    formData.append("name", "New Name");

    const result = await updateAccountSettingsAction(formData);

    expect(result.success).toBe(false);
  });
});
