import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./LoginForm";
import * as React from "react";

const mockOnSubmit = vi.fn();

vi.mock("@/features/auth/login/hooks/useLoginForm", () => ({
  useLoginForm: () => ({
    form: {
      handleSubmit: (fn: any) => (e: any) => {
        e.preventDefault();
        return fn({ email: "foo", password: "bar" });
      },
      control: {},
    },
    onSubmit: mockOnSubmit,
    isLoading: false,
  }),
}));

vi.mock("@/features/auth/login/ui/LoginFormView", () => ({
  LoginFormView: ({ form, onSubmit, isLoading }: any) => (
    <div>
      <button onClick={() => onSubmit({ email: "foo", password: "bar" })}>
        SUBMIT
      </button>
      {isLoading && <span>Loading</span>}
    </div>
  ),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it("calls onSubmit when form is submitted", async () => {
    render(<LoginForm />);
    await userEvent.click(screen.getByText("SUBMIT"));

    expect(mockOnSubmit).toHaveBeenCalledWith({ email: "foo", password: "bar" });
  });

  it("renders the LoginFormView with props from hook", () => {
    render(<LoginForm />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
