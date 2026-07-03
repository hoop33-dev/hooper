import { Over } from "@dnd-kit/core";
import { describe, expect, it } from "vitest";
import { isInsertAfter, isInsertAfterForBlockTarget } from "./insertPosition";

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

describe("isInsertAfterForBlockTarget", () => {
  it("returns true over the block header area", () => {
    expect(isInsertAfterForBlockTarget(112, makeOver(100, 80))).toBe(true);
  });

  it("falls back to midpoint logic below the header", () => {
    // header zone here is top+min(44, 80*0.4) = 132; midpoint is 140.
    expect(isInsertAfterForBlockTarget(150, makeOver(100, 80))).toBe(true);
    expect(isInsertAfterForBlockTarget(135, makeOver(100, 80))).toBe(false);
  });
});
