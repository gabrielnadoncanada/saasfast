import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RegisterForm } from "./RegisterForm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as React from "react";

const mockPush = vi.fn();
const mockOnSubmit = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Permet de patcher dynamiquement l’erreur serveur
let serverErrorValue: string | null = null;

vi.mock("@/features/auth/register/hooks/useRegisterForm", () => ({
  useRegisterForm: () => ({
    form: {
      handleSubmit: (cb: any) => (e: any) =>
        cb({
          full_name: "Test",
          email: "test@test.com",
          password: "testpass",
        }),
      control: {},
    },
    onSubmit: mockOnSubmit,
    get serverError() {
      return serverErrorValue;
    },
  }),
}));

vi.mock("@/features/auth/register/ui/RegisterFormView", () => ({
  RegisterFormView: ({ form, onSubmit, serverError }: any) => (
    <form data-testid="register-form" onSubmit={form.handleSubmit(onSubmit)}>
      <button type="submit">Submit</button>
      {serverError && <div data-testid="server-error">{serverError}</div>}
    </form>
  ),
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serverErrorValue = null;
  });

  it("redirige vers /register/confirmation si onSubmit retourne true", async () => {
    mockOnSubmit.mockResolvedValueOnce(true);

    render(<RegisterForm />);
    fireEvent.submit(screen.getByTestId("register-form"));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/register/confirmation");
    });
  });

  it("n'appelle pas router.push si onSubmit retourne false", async () => {
    mockOnSubmit.mockResolvedValueOnce(false);

    render(<RegisterForm />);
    fireEvent.submit(screen.getByTestId("register-form"));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it("affiche l’erreur serveur si présente", () => {
    serverErrorValue = "Erreur côté serveur";

    render(<RegisterForm />);
    expect(screen.getByTestId("server-error")).toHaveTextContent(
      "Erreur côté serveur"
    );
  });
});
