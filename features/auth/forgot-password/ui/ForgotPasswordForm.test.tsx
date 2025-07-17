import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import * as React from "react";

const mockOnSubmit = vi.fn();

vi.mock("@/features/auth/forgot-password/hooks/useForgotPasswordForm", () => ({
  useForgotPasswordForm: () => ({
    form: {},
    onSubmit: mockOnSubmit,
    serverError: "Email not found",
    isLoading: false,
    isSuccess: false,
  }),
}));

vi.mock("@/features/auth/forgot-password/ui/ForgotPasswordFormView", () => ({
  ForgotPasswordFormView: ({
    onSubmit,
    serverError,
    isLoading,
    isSuccess,
  }: any) => (
    <div>
      <button onClick={() => onSubmit({ email: "test@mail.com" })}>
        SUBMIT
      </button>
      <span data-testid="error">{serverError}</span>
      <span data-testid="success">{isSuccess ? "SUCCESS" : "NOT_SUCCESS"}</span>
      {isLoading && <span>Loading</span>}
    </div>
  ),
}));

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it("appelle onSubmit avec les bonnes données", async () => {
    render(<ForgotPasswordForm />);
    await userEvent.click(screen.getByText("SUBMIT"));

    expect(mockOnSubmit).toHaveBeenCalledWith({ email: "test@mail.com" });
  });

  it("affiche l'erreur serveur reçue du hook", () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByTestId("error")).toHaveTextContent("Email not found");
  });

  it("affiche l'état de succès reçu du hook", () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByTestId("success")).toHaveTextContent("NOT_SUCCESS");
  });
});

describe("ForgotPasswordForm avec succès", () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it("affiche l'état de succès quand isSuccess est true", () => {
    vi.doMock(
      "@/features/auth/forgot-password/hooks/useForgotPasswordForm",
      () => ({
        useForgotPasswordForm: () => ({
          form: {},
          onSubmit: mockOnSubmit,
          serverError: null,
          isLoading: false,
          isSuccess: true,
        }),
      })
    );

    render(<ForgotPasswordForm />);
    expect(screen.getByTestId("success")).toHaveTextContent("SUCCESS");
  });
});
