import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerAction } from "./register.action";
import { safeParseForm } from "@/shared/lib/safeParseForm";
import { db } from "@/shared/db";
import { createClient } from "@/shared/api/supabase/server";

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

  it("retourne une erreur si l'auth Supabase échoue", async () => {
    (safeParseForm as any).mockResolvedValueOnce({
      success: true,
      data: { email: "foo@mail.com", password: "123456", full_name: "Foo" },
    });
    getSignUp().mockResolvedValueOnce({
      data: {},
      error: { message: "Email déjà utilisé" },
    });

    const result = await registerAction(
      createRegisterForm("foo@mail.com", "123456", "Foo")
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/déjà utilisé/i);
    }
  });

  it("rollback si la création du profil DB échoue", async () => {
    (safeParseForm as any).mockResolvedValueOnce({
      success: true,
      data: { email: "foo@mail.com", password: "123456", full_name: "Foo" },
    });
    getSignUp().mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    getDbInsert().mockReturnValue({
      values: vi.fn().mockRejectedValue(new Error("Erreur DB")),
    });

    const result = await registerAction(
      createRegisterForm("foo@mail.com", "123456", "Foo")
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/erreur db/i);
      expect(getDeleteUser()).toHaveBeenCalledWith("user-1");
    }
  });

  it("retourne success si tout va bien", async () => {
    (safeParseForm as any).mockResolvedValueOnce({
      success: true,
      data: { email: "foo@mail.com", password: "123456", full_name: "Foo" },
    });
    getSignUp().mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    getDbInsert().mockReturnValue({
      values: vi.fn().mockResolvedValue({ id: "user-1" }),
    });

    const result = await registerAction(
      createRegisterForm("foo@mail.com", "123456", "Foo")
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        email: "foo@mail.com",
        password: "123456",
        full_name: "Foo",
      });
    }
  });
});
