import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResetPasswordForm } from "./ResetPasswordForm";
import * as React from "react";

const mockOnSubmit = vi.fn();

vi.mock("@/features/auth/reset-password/hooks/useResetPasswordForm", () => ({
  useResetPasswordForm: () => ({
    form: {
      handleSubmit: (fn: any) => (e: any) => {
        e.preventDefault();
        return fn({ password: "strongpassword123" });
      },
      control: {},
    },
    onSubmit: mockOnSubmit,
    isLoading: false,
  }),
}));

vi.mock("@/features/auth/reset-password/ui/ResetPasswordFormView", () => ({
  ResetPasswordFormView: ({ form, onSubmit, isLoading }: any) => (
    <div>
      <button onClick={() => onSubmit({ password: "strongpassword123" })}>
        SUBMIT
      </button>
      {isLoading && <span>Loading</span>}
    </div>
  ),
}));

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it("calls onSubmit when form is submitted", async () => {
    render(<ResetPasswordForm />);
    await userEvent.click(screen.getByText("SUBMIT"));

    expect(mockOnSubmit).toHaveBeenCalledWith({ password: "strongpassword123" });
  });

  it("renders the ResetPasswordFormView with props from hook", () => {
    render(<ResetPasswordForm />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});