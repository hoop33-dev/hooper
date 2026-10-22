import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole("button", { name: "Click me" }),
    ).toBeInTheDocument();
  });

  it("applies the primary variant by default", () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-primary-orange");
  });

  it("applies the secondary variant when requested", () => {
    render(<Button variant="secondary">Go</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-navy");
  });

  it("merges caller-supplied class names", () => {
    render(<Button className="custom-class">Go</Button>);
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("forwards native button props", () => {
    render(<Button disabled>Go</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
