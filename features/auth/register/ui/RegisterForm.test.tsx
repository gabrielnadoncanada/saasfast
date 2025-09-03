import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RegisterForm } from "./RegisterForm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as React from "react";

const mockOnSubmit = vi.fn();

vi.mock("@/features/auth/register/hooks/useRegisterForm", () => ({
  useRegisterForm: () => ({
    form: {
      handleSubmit: (cb: any) => (e: any) => {
        e.preventDefault();
        return cb({
          full_name: "Test",
          email: "test@test.com",
          password: "testpass",
        });
      },
      control: {},
    },
    onSubmit: mockOnSubmit,
    isLoading: false,
  }),
}));

vi.mock("@/features/auth/register/ui/RegisterFormView", () => ({
  RegisterFormView: ({ form, onSubmit, isLoading }: any) => (
    <form data-testid="register-form" onSubmit={form.handleSubmit(onSubmit)}>
      <button type="submit">Submit</button>
      {isLoading && <span>Loading</span>}
    </form>
  ),
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls onSubmit when form is submitted", async () => {
    render(<RegisterForm />);
    fireEvent.submit(screen.getByTestId("register-form"));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        full_name: "Test",
        email: "test@test.com",
        password: "testpass",
      });
    });
  });

  it("renders the RegisterFormView with props from hook", () => {
    render(<RegisterForm />);
    expect(screen.getByTestId("register-form")).toBeInTheDocument();
  });
});
