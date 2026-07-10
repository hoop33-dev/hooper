import {
  closestCenter,
  pointerWithin,
  type CollisionDetection,
} from "@dnd-kit/core";

function idType(id: string | number): string {
  const s = String(id);
  const i = s.indexOf(":");
  return i === -1 ? s : s.slice(0, i);
}

/** Which droppable types a given drag source is allowed to target. */
function allowedTargets(activeType: string): string[] {
  // "gap" is the space between two block cards (and before the first / after
  // the last) — every drag source that can end up placing/creating a block
  // can target it; see resolveGapBlockPosition in useBlockExerciseDnd.ts.
  if (activeType === "block-exercise")
    return ["block-exercise", "block", "gap"];
  if (activeType === "block") return ["block", "session", "gap"];
  if (activeType === "library")
    return ["block-exercise", "block", "new-block", "gap"];
  // A block template always creates a whole new block, so it targets the
  // same zones a whole block does, plus "+ Add block" (equivalent to its
  // session — see resolveTargetSession in useBlockExerciseDnd.ts). A
  // multi-block session template targets the same zones — it just creates
  // several new blocks instead of one.
  if (activeType === "block-template" || activeType === "session-template")
    return ["block", "session", "new-block", "gap"];
  // A session column targets the insertion gaps between columns, plus the
  // columns themselves — hovering a column's left/right half resolves to the
  // gap on that side, the same way blocks resolve from a hovered block.
  if (activeType === "session-col") return ["session-gap", "session-col"];
  return [];
}

// Most-specific-first: an exercise row wins over its containing block, the
// "add block" zone wins over the session column behind it, and a gap (which
// physically sits inside the session column's own bounds) wins over that
// column too.
const TYPE_PRIORITY = [
  "block-exercise",
  "new-block",
  "gap",
  "block",
  "session",
  "session-gap",
  "session-col",
];

/**
 * Drag-type-aware collision detection. Restricts candidate droppables to the
 * ones that make sense for what's being dragged (so, e.g., an exercise never
 * targets the whole session column or the "add block" zone), then resolves to
 * the single most-specific target under the pointer. This gives one stable
 * drop target — and therefore one insertion line — instead of several
 * overlapping droppables all lighting up.
 */
export const blockDndCollision: CollisionDetection = (args) => {
  const activeType = idType(args.active.id);
  const allowed = allowedTargets(activeType);
  const containers = args.droppableContainers.filter((c) =>
    allowed.includes(idType(c.id)),
  );
  if (containers.length === 0) return [];

  const pointerHits = pointerWithin({
    ...args,
    droppableContainers: containers,
  });
  if (pointerHits.length === 0) return [];

  const topType = pointerHits
    .map((hit) => idType(hit.id))
    .sort((a, b) => TYPE_PRIORITY.indexOf(a) - TYPE_PRIORITY.indexOf(b))[0];
  // Restrict closestCenter to containers the pointer is actually within — not
  // every container of the winning type. closestCenter ranks by distance to
  // the container's own center, so given e.g. two blocks of very different
  // heights, a sibling the pointer never touched can have a numerically
  // closer center than the (taller) block it's really hovering, especially
  // near that block's near edge, causing the wrong one to win.
  const topHitIds = new Set(
    pointerHits
      .filter((hit) => idType(hit.id) === topType)
      .map((hit) => hit.id),
  );
  const topContainers = containers.filter((c) => topHitIds.has(c.id));
  return closestCenter({ ...args, droppableContainers: topContainers });
};
