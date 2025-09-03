import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { GitHubButton } from "./GitHubButton";

describe("GitHubButton", () => {
  it("renders the GitHub button with correct text", () => {
    render(<GitHubButton />);

    expect(
      screen.getByRole("button", { name: /connexion avec github/i })
    ).toBeInTheDocument();
  });

  it("applies custom className when provided", () => {
    render(<GitHubButton className="custom-class" />);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });

  it("disables the button when disabled prop is true", () => {
    render(<GitHubButton disabled={true} />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("renders the GitHub icon", () => {
    render(<GitHubButton />);

    const svg = screen.getByRole("button").querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
  });

  it("has button type set to button", () => {
    render(<GitHubButton />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("type", "button");
  });
});
