import type { Active } from "@dnd-kit/core";
import { describe, expect, it } from "vitest";
import { blockDndCollision } from "./collision";

function rect(top: number, height: number) {
  return { top, left: 0, width: 200, height, bottom: top + height, right: 200 };
}

function container(id: string) {
  return { id } as unknown as Parameters<
    typeof blockDndCollision
  >[0]["droppableContainers"][number];
}

function active(id: string): Active {
  return { id, data: { current: undefined }, rect: { current: {} } } as Active;
}

describe("blockDndCollision", () => {
  it("targets the taller block the pointer is actually over, not a shorter neighbour with a closer center", () => {
    // Mirrors the reported bug: a short "Cardio" block (0-90) sits directly
    // above a taller "Warm Up" block (98-238). Hovering near Warm Up's own
    // top edge (y=100) is still well outside Cardio's rect, but Cardio's much
    // shorter card has a center (45) numerically closer to y=100 than Warm
    // Up's own center (168) does — a naive closest-center tie-break across
    // every same-type container (not just ones the pointer is within) would
    // wrongly pick Cardio.
    const droppableRects = new Map([
      ["block:cardio", rect(0, 90)],
      ["block:warmup", rect(98, 140)],
    ]);
    const droppableContainers = [
      container("block:cardio"),
      container("block:warmup"),
    ];

    const result = blockDndCollision({
      active: active("library:ex-1"),
      collisionRect: rect(100, 40),
      droppableRects,
      droppableContainers,
      pointerCoordinates: { x: 10, y: 100 },
    });

    expect(result.map((c) => c.id)).toEqual(["block:warmup"]);
  });

  it("still resolves the correct block when the pointer is over the shorter one", () => {
    const droppableRects = new Map([
      ["block:cardio", rect(0, 90)],
      ["block:warmup", rect(98, 140)],
    ]);
    const droppableContainers = [
      container("block:cardio"),
      container("block:warmup"),
    ];

    const result = blockDndCollision({
      active: active("library:ex-1"),
      collisionRect: rect(20, 40),
      droppableRects,
      droppableContainers,
      pointerCoordinates: { x: 10, y: 20 },
    });

    expect(result.map((c) => c.id)).toEqual(["block:cardio"]);
  });

  it("returns nothing when the pointer isn't over any allowed container", () => {
    const droppableRects = new Map([["block:cardio", rect(0, 90)]]);
    const droppableContainers = [container("block:cardio")];

    const result = blockDndCollision({
      active: active("library:ex-1"),
      collisionRect: rect(200, 40),
      droppableRects,
      droppableContainers,
      pointerCoordinates: { x: 10, y: 200 },
    });

    expect(result).toEqual([]);
  });

  it("prefers a between-blocks gap over the session column it physically sits inside", () => {
    // The gap sits inside the session column's own bounding rect (the column
    // wraps every block plus the space between them), so both register a
    // pointerWithin hit — the gap, being the more specific target, should win
    // so a drop between two blocks lands there instead of at the session's
    // end.
    const droppableRects = new Map([
      ["session:s1", rect(0, 500)],
      ["gap:s1:1", rect(240, 20)],
    ]);
    const droppableContainers = [
      container("session:s1"),
      container("gap:s1:1"),
    ];

    const result = blockDndCollision({
      active: active("library:ex-1"),
      collisionRect: rect(245, 10),
      droppableRects,
      droppableContainers,
      pointerCoordinates: { x: 10, y: 250 },
    });

    expect(result.map((c) => c.id)).toEqual(["gap:s1:1"]);
  });
});
