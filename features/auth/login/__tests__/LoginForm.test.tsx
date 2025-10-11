import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoginForm } from "@/features/auth/login/ui/LoginForm";
import {
  mockFormState,
  createMockUser,
  ActionResponseBuilder,
} from "@/__tests__/setup/test-utils";

// Mock the hook and view component
vi.mock("@/features/auth/login/hooks/useLoginForm", () => ({
  useLoginForm: vi.fn(),
}));

vi.mock("@/features/auth/login/ui/LoginFormView", () => ({
  LoginFormView: vi.fn(({ form, onSubmit, isLoading, actionState }) => (
    <div data-testid="login-form-view">
      <div data-testid="loading-state">
        {isLoading ? "loading" : "not-loading"}
      </div>
      <div data-testid="action-state">
        {actionState?.success ? "success" : "no-action"}
      </div>
      <button
        data-testid="submit-button"
        onClick={() =>
          onSubmit({ email: "test@example.com", password: "password" })
        }
      >
        Submit
      </button>
    </div>
  )),
}));

describe("LoginForm", () => {
  const mockUseLoginForm = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock useLoginForm hook
    const { useLoginForm } = await import(
      "@/features/auth/login/hooks/useLoginForm"
    );
    mockUseLoginForm.mockReturnValue({
      form: mockFormState,
      onSubmit: mockOnSubmit,
      isLoading: false,
      actionState: null,
    });
    vi.mocked(useLoginForm).mockImplementation(mockUseLoginForm);
  });

  it("should render LoginFormView with hook data", () => {
    render(<LoginForm />);

    expect(screen.getByTestId("login-form-view")).toBeInTheDocument();
    expect(screen.getByTestId("loading-state")).toHaveTextContent(
      "not-loading"
    );
    expect(screen.getByTestId("action-state")).toHaveTextContent("no-action");
  });

  it("should pass loading state to LoginFormView", () => {
    mockUseLoginForm.mockReturnValue({
      form: mockFormState,
      onSubmit: mockOnSubmit,
      isLoading: true,
      actionState: null,
    });

    render(<LoginForm />);

    expect(screen.getByTestId("loading-state")).toHaveTextContent("loading");
  });

  it("should pass action state to LoginFormView", () => {
    // Utilisation du Builder Pattern pour créer un état plus réaliste
    const successState = ActionResponseBuilder.success(
      createMockUser({ email: "admin@test.com" })
    ).build();

    mockUseLoginForm.mockReturnValue({
      form: mockFormState,
      onSubmit: mockOnSubmit,
      isLoading: false,
      actionState: successState,
    });

    render(<LoginForm />);

    expect(screen.getByTestId("action-state")).toHaveTextContent("success");
  });

  it("should call useLoginForm hook", () => {
    render(<LoginForm />);

    expect(mockUseLoginForm).toHaveBeenCalledTimes(1);
  });

  it("should pass all hook props to LoginFormView", async () => {
    const { LoginFormView } = await import(
      "@/features/auth/login/ui/LoginFormView"
    );

    render(<LoginForm />);

    expect(LoginFormView).toHaveBeenCalledWith(
      {
        form: mockFormState,
        onSubmit: mockOnSubmit,
        isLoading: false,
        actionState: null,
      },
      undefined
    );
  });
});
