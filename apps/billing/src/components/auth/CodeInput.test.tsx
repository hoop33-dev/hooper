import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { CodeInput, normaliseCode } from "./CodeInput";

function Harness({ onComplete }: { onComplete: (v: string) => void }) {
  const [v, setV] = useState("");
  return <CodeInput value={v} onChange={setV} onComplete={onComplete} />;
}

describe("normaliseCode", () => {
  it("strips non-digits and caps at 6", () => {
    expect(normaliseCode(" 12-34 56 78")).toBe("123456");
  });
});

describe("CodeInput", () => {
  it("accepts a pasted code and fires onComplete once full", () => {
    const onComplete = vi.fn();
    render(<Harness onComplete={onComplete} />);
    const input = screen.getByLabelText("6-digit verification code");
    fireEvent.change(input, { target: { value: "482 193" } });
    expect(input).toHaveValue("482193");
    expect(onComplete).toHaveBeenCalledWith("482193");
  });

  it("supports backspace without completing", () => {
    const onComplete = vi.fn();
    render(<Harness onComplete={onComplete} />);
    const input = screen.getByLabelText("6-digit verification code");
    fireEvent.change(input, { target: { value: "123" } });
    fireEvent.change(input, { target: { value: "12" } });
    expect(input).toHaveValue("12");
    expect(onComplete).not.toHaveBeenCalled();
  });
});
