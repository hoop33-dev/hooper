import { describe, expect, it } from "vitest";
import { err, ok, toErrorMessage } from "./result";

describe("result", () => {
  it("ok wraps data in a success result", () => {
    const result = ok(42);
    expect(result).toEqual({ ok: true, data: 42 });
  });

  it("err wraps a message in a failure result", () => {
    const result = err("nope");
    expect(result).toEqual({ ok: false, error: "nope" });
  });

  it("narrows on the ok discriminant", () => {
    const result = ok("hello");
    if (result.ok) {
      expect(result.data).toBe("hello");
    } else {
      throw new Error("expected ok result");
    }
  });
});

describe("toErrorMessage", () => {
  it("returns the message of an Error instance", () => {
    expect(toErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("returns a string value unchanged", () => {
    expect(toErrorMessage("raw string")).toBe("raw string");
  });

  it("falls back to a generic message for unknown values", () => {
    expect(toErrorMessage({ weird: true })).toBe(
      "An unexpected error occurred.",
    );
    expect(toErrorMessage(null)).toBe("An unexpected error occurred.");
  });
});
