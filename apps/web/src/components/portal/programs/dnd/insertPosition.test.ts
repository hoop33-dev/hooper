import { Over } from "@dnd-kit/core";
import { describe, expect, it } from "vitest";
import { isInsertAfter } from "./insertPosition";

function makeOver(top: number, height: number) {
  return {
    id: "block-exercise:over",
    rect: { top, height },
  } as unknown as Over;
}

describe("isInsertAfter", () => {
  it("returns false when the pointer is in the top half", () => {
    expect(isInsertAfter(110, makeOver(100, 40))).toBe(false);
  });

  it("returns true when the pointer is in the bottom half", () => {
    expect(isInsertAfter(130, makeOver(100, 40))).toBe(true);
  });

  it("returns false without pointer coordinates", () => {
    expect(isInsertAfter(null, makeOver(100, 40))).toBe(false);
  });
});
