import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResetPasswordForm } from "./ResetPasswordForm";
import * as React from "react";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

const mockOnSubmit = vi.fn();

vi.mock("@/features/auth/reset-password/hooks/useResetPasswordForm", () => ({
  useResetPasswordForm: () => ({
    form: {},
    onSubmit: mockOnSubmit,
    serverError: "Password too weak",
    isLoading: false,
  }),
}));

vi.mock("@/features/auth/reset-password/ui/ResetPasswordFormView", () => ({
  ResetPasswordFormView: ({ onSubmit, serverError, isLoading }: any) => (
    <div>
      <button onClick={() => onSubmit({ password: "strongpassword123" })}>
        SUBMIT
      </button>
      <span data-testid="error">{serverError}</span>
      {isLoading && <span>Loading</span>}
    </div>
  ),
}));

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    pushMock.mockClear();
    refreshMock.mockClear();
    mockOnSubmit.mockClear();
  });

  it("appelle router.push et refresh si reset password OK", async () => {
    mockOnSubmit.mockResolvedValueOnce(true);

    render(<ResetPasswordForm />);
    await userEvent.click(screen.getByText("SUBMIT"));

    expect(pushMock).toHaveBeenCalledWith("/login");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("affiche l'erreur serveur reçue du hook", () => {
    render(<ResetPasswordForm />);
    expect(screen.getByTestId("error")).toHaveTextContent("Password too weak");
  });

  it("n'appelle pas router si reset password KO", async () => {
    mockOnSubmit.mockResolvedValueOnce(false);

    render(<ResetPasswordForm />);
    await userEvent.click(screen.getByText("SUBMIT"));

    expect(pushMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});