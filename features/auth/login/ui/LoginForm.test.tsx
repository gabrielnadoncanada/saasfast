import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./LoginForm";
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

vi.mock("@/features/auth/login/hooks/useLoginForm", () => ({
  useLoginForm: () => ({
    form: {},
    onSubmit: mockOnSubmit,
    serverError: "bad credentials",
    isLoading: false,
  }),
}));

vi.mock("@/features/auth/login/ui/LoginFormView", () => ({
  LoginFormView: ({ onSubmit, serverError, isLoading }: any) => (
    <div>
      <button onClick={() => onSubmit({ email: "foo", password: "bar" })}>
        SUBMIT
      </button>
      <span data-testid="error">{serverError}</span>
      {isLoading && <span>Loading</span>}
    </div>
  ),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    pushMock.mockClear();
    refreshMock.mockClear();
    mockOnSubmit.mockClear();
  });

  it("appelle router.push et refresh si login OK", async () => {
    mockOnSubmit.mockResolvedValueOnce(true);

    render(<LoginForm />);
    await userEvent.click(screen.getByText("SUBMIT"));

    expect(pushMock).toHaveBeenCalledWith("/dashboard");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("affiche l’erreur serveur reçue du hook", () => {
    render(<LoginForm />);
    expect(screen.getByTestId("error")).toHaveTextContent("bad credentials");
  });

  it("n'appelle pas router si login KO", async () => {
    mockOnSubmit.mockResolvedValueOnce(false);

    render(<LoginForm />);
    await userEvent.click(screen.getByText("SUBMIT"));

    expect(pushMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
