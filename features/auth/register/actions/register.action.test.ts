import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerAction } from "./register.action";
import { safeParseForm } from "@/shared/lib/safeParseForm";
import { prisma } from "@/shared/api/prisma";
import { createClient } from "@/shared/api/supabase/server";

vi.mock("@/shared/api/prisma", () => {
  const mockPrismaCreate = vi.fn();
  return {
    prisma: {
      profile: {
        create: mockPrismaCreate,
        __mock: { mockPrismaCreate },
      },
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

const getPrismaCreate = () =>
  (prisma.profile as any).__mock.mockPrismaCreate as ReturnType<typeof vi.fn>;

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

  it("rollback si la création du profil Prisma échoue", async () => {
    (safeParseForm as any).mockResolvedValueOnce({
      success: true,
      data: { email: "foo@mail.com", password: "123456", full_name: "Foo" },
    });
    getSignUp().mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });
    getPrismaCreate().mockRejectedValueOnce(new Error("Erreur Prisma"));

    const result = await registerAction(
      createRegisterForm("foo@mail.com", "123456", "Foo")
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/erreur prisma/i);
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
    getPrismaCreate().mockResolvedValueOnce({ id: "user-1" });

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
