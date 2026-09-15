import type { AthleteBlockExercise } from "@hooper/api";
import type { ExerciseRow, ExerciseStyleRow } from "@hooper/db";

/** Sentinel for "no style" in a plain string-keyed override map — style_id
 * can be null (unlike a variant's exercise_id, which is always set), and
 * resolveMostCommonId only compares string ids. */
const NO_STYLE = "";

/**
 * Resolves a sparse per-set override map to its "most common, tie → first"
 * winner across `setsCount` sets — mirrors
 * apps/web/src/lib/blockExerciseDisplay.ts's resolveMostCommonId. Each set's
 * effective value is `overrides[i] ?? baseId`; ties are broken by whichever
 * id appeared first (lowest set_index).
 */
export function resolveMostCommonId(
  baseId: string,
  overrides: Record<number, string>,
  setsCount: number,
): { winnerId: string; nonMatchingCount: number } {
  if (setsCount <= 0) return { winnerId: baseId, nonMatchingCount: 0 };

  const counts = new Map<string, number>();
  const firstSeenAt = new Map<string, number>();
  for (let i = 0; i < setsCount; i++) {
    const id = overrides[i] ?? baseId;
    counts.set(id, (counts.get(id) ?? 0) + 1);
    if (!firstSeenAt.has(id)) firstSeenAt.set(id, i);
  }

  let winnerId = baseId;
  let winnerCount = 0;
  for (const [id, count] of counts) {
    const isBetter =
      count > winnerCount ||
      (count === winnerCount &&
        firstSeenAt.get(id)! < (firstSeenAt.get(winnerId) ?? Infinity));
    if (isBetter) {
      winnerId = id;
      winnerCount = count;
    }
  }
  return { winnerId, nonMatchingCount: setsCount - winnerCount };
}

/** The exercise a given set actually uses — the variant override if one
 * exists for that set, else the placement's own exercise. */
export function resolveSetExercise(
  be: AthleteBlockExercise,
  setIndex: number,
): ExerciseRow {
  return be.setVariants[setIndex] ?? be.exercise;
}

/** The style a given set actually uses — its own override (which may
 * explicitly be null, meaning "no style") if one exists, else the
 * placement's own style. */
export function resolveSetStyle(
  be: AthleteBlockExercise,
  setIndex: number,
): ExerciseStyleRow | null {
  return setIndex in be.setStyles ? be.setStyles[setIndex]! : be.style;
}

/**
 * Effective style for a subset of a placement's sets (a variant group — see
 * groupSetsByVariant), resolved the same "most common, tie → first" way as
 * web's resolveStylePill. `uniform` is true only when *every* set in
 * `setIndices` (including the placement's own default) shares that exact
 * style — not merely that it won a plurality — so callers can tell a true
 * whole-exercise style (e.g. "Warmup" applies to all 4 sets, shown once as a
 * group subheading) apart from a mix that needs each set labelled on its own
 * row instead (see resolveSetStyle). Null when none of those sets has any
 * style at all.
 */
export function resolveGroupStyle(
  be: AthleteBlockExercise,
  setIndices: number[],
): { name: string; uniform: boolean } | null {
  const overrides = Object.fromEntries(
    Object.entries(be.setStyles).map(([setIndex, style]) => [
      Number(setIndex),
      style?.id ?? NO_STYLE,
    ]),
  );
  // resolveMostCommonId indexes its overrides map by position 0..setsCount-1,
  // so a group's setIndices (e.g. [2] for a group starting mid-placement)
  // must be re-keyed relative to the group, not left as original set indices.
  const restricted: Record<number, string> = {};
  setIndices.forEach((setIndex, i) => {
    restricted[i] = overrides[setIndex] ?? be.style_id ?? NO_STYLE;
  });
  const { winnerId, nonMatchingCount } = resolveMostCommonId(
    be.style_id ?? NO_STYLE,
    restricted,
    setIndices.length,
  );
  if (winnerId === NO_STYLE) return null;

  const winnerStyle =
    Object.values(be.setStyles).find((s) => s?.id === winnerId) ??
    (be.style?.id === winnerId ? be.style : null);
  if (!winnerStyle) return null;

  return {
    name: winnerStyle.name,
    uniform: nonMatchingCount === 0,
  };
}

/**
 * Splits a placement's sets into contiguous runs by effective exercise, so
 * the session player can render each run as its own exercise block. A
 * placement with no per-set variant overrides (the common case) always
 * yields exactly one group covering every set. A placement where every set
 * is uniformly overridden to the same variant also yields one group, using
 * that variant. Only a placement whose sets actually switch exercises along
 * the way yields multiple groups, in set order.
 */
export function groupSetsByVariant(
  be: AthleteBlockExercise,
): { exercise: ExerciseRow; setIndices: number[] }[] {
  const groups: { exercise: ExerciseRow; setIndices: number[] }[] = [];
  for (let setIndex = 0; setIndex < be.sets; setIndex++) {
    const exercise = resolveSetExercise(be, setIndex);
    const current = groups[groups.length - 1];
    if (current && current.exercise.id === exercise.id) {
      current.setIndices.push(setIndex);
    } else {
      groups.push({ exercise, setIndices: [setIndex] });
    }
  }
  return groups;
}
