import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerAction } from "./register.action";
import { safeParseForm } from "@/shared/lib/safeParseForm";
import { db } from "@/shared/db/drizzle/db";
import { createClient } from "@/shared/db/supabase/server";
import { redirect } from "next/navigation";

vi.mock("@/shared/db", () => {
  const mockInsert = vi.fn().mockReturnValue({
    values: vi.fn().mockResolvedValue({}),
  });
  return {
    db: {
      insert: mockInsert,
      __mock: { mockInsert },
    },
  };
});

vi.mock("@/shared/api/supabase/server", () => {
  const mockSignUp = vi.fn();
  const mockDeleteUser = vi.fn();
  return {
    createClient: () => ({
      auth: {
        signUp: mockSignUp,
        admin: { deleteUser: mockDeleteUser },
      },
      __mock: { mockSignUp, mockDeleteUser },
    }),
  };
});

vi.mock("@/shared/lib/safeParseForm", () => ({
  safeParseForm: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

const getDbInsert = () =>
  (db as any).__mock.mockInsert as ReturnType<typeof vi.fn>;

const getSignUp = () =>
  (createClient() as any).__mock.mockSignUp as ReturnType<typeof vi.fn>;

const getDeleteUser = () =>
  (createClient() as any).__mock.mockDeleteUser as ReturnType<typeof vi.fn>;

function createRegisterForm(
  email: string,
  password: string,
  full_name: string
) {
  const form = new FormData();
  form.append("email", email);
  form.append("password", password);
  form.append("full_name", full_name);
  return form;
}

describe("registerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne une erreur si la validation échoue", async () => {
    (safeParseForm as any).mockResolvedValueOnce({
      success: false,
      error: "Validation failed",
      fieldErrors: { email: ["Invalid email"] },
    });

    const result = await registerAction(createRegisterForm("", "", ""));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Validation failed");
    }
  });

  it("returns error when Supabase auth fails", async () => {
    (safeParseForm as any).mockResolvedValueOnce({
      success: true,
      data: { email: "foo@mail.com", password: "123456", full_name: "Foo" },
    });
    getSignUp().mockResolvedValueOnce({
      data: {},
      error: { message: "User already registered" },
    });

    const result = await registerAction(
      createRegisterForm("foo@mail.com", "123456", "Foo")
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/déjà utilisée/i);
    }
  });

  it("redirects when registration succeeds", async () => {
    (safeParseForm as any).mockResolvedValueOnce({
      success: true,
      data: { email: "foo@mail.com", password: "123456", full_name: "Foo" },
    });
    getSignUp().mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });

    await registerAction(createRegisterForm("foo@mail.com", "123456", "Foo"));

    expect(redirect).toHaveBeenCalledWith(expect.stringContaining("/auth"));
  });
});
