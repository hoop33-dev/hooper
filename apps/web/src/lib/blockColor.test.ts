import { BLOCK_COLOR_PALETTE, defaultBlockColor } from "@hooper/shared";
import { describe, expect, it } from "vitest";

describe("defaultBlockColor", () => {
  it("is deterministic for the same name", () => {
    expect(defaultBlockColor("Warm-Up")).toBe(defaultBlockColor("Warm-Up"));
  });

  it("picks the palette entry at name.length % palette.length", () => {
    const name = "Primary Strength"; // length 16
    const expected =
      BLOCK_COLOR_PALETTE[name.length % BLOCK_COLOR_PALETTE.length];
    expect(defaultBlockColor(name)).toBe(expected);
  });

  it("returns a value from the palette for an empty name", () => {
    expect(BLOCK_COLOR_PALETTE).toContain(defaultBlockColor(""));
  });

  it("wraps around for names longer than the palette", () => {
    const longName = "a".repeat(BLOCK_COLOR_PALETTE.length + 3);
    expect(defaultBlockColor(longName)).toBe(defaultBlockColor("a".repeat(3)));
  });
});
