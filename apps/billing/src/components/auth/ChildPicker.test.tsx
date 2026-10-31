import { child } from "@/src/lib/testFixtures";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChildPicker } from "./ChildPicker";
import { ForToggle } from "./ForToggle";

describe("ForToggle", () => {
  it("reports the chosen side", () => {
    const onChange = vi.fn();
    render(<ForToggle forChild={false} onChange={onChange} />);
    expect(screen.getByRole("radio", { name: /for me/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    fireEvent.click(screen.getByRole("radio", { name: /for my child/i }));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe("ChildPicker", () => {
  const kids = [
    child(),
    child({ profile_id: "kid2", first_name: "Maya", username: "mayaw" }),
  ];

  it("marks the selected child and switches selection", () => {
    const onChange = vi.fn();
    render(
      <ChildPicker
        childList={kids}
        choice={{ who: "child", childId: "kid1" }}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("radio", { name: /liam/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    fireEvent.click(screen.getByRole("radio", { name: /maya/i }));
    expect(onChange).toHaveBeenCalledWith({ who: "child", childId: "kid2" });
  });

  it("offers 'Add a new child'", () => {
    const onChange = vi.fn();
    render(
      <ChildPicker
        childList={kids}
        choice={{ who: "child", childId: "kid1" }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: /add a new child/i }));
    expect(onChange).toHaveBeenCalledWith({ who: "new_child" });
  });
});
