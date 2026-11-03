import type { BlockExerciseWithDetails, ExerciseStyleRow } from "@hooper/db";

/** Sentinel for "no style" in a plain string-keyed override map — style_id
 * can be null (unlike a variant's exercise_id, which is always set), and
 * resolveMostCommonId only compares string ids. */
const NO_STYLE = "";

/**
 * Resolves a sparse per-set override map to its "most common, tie → first"
 * winner across `setsCount` sets — the shared primitive behind both the
 * block-exercise display name (variant) and the style pill (style). Each
 * set's effective value is `overrides[i] ?? baseId`; ties are broken by
 * whichever id appeared first (lowest set_index).
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

/**
 * Effective display name for a placed exercise, resolving its per-set
 * variant overrides: the plain exercise name when every set agrees (either
 * unanimously on the base exercise, or unanimously on one variant), or the
 * winning variant's name with " +N" (N = sets that don't match it) once
 * they diverge. A base-exercise win never gets a suffix — "no variant"
 * winning just means the exercise's own name, plain.
 */
export function resolveDisplayName(
  blockExercise: BlockExerciseWithDetails,
): string {
  const overrides = Object.fromEntries(
    Object.entries(blockExercise.setVariants).map(([setIndex, variant]) => [
      Number(setIndex),
      variant.id,
    ]),
  );
  const { winnerId, nonMatchingCount } = resolveMostCommonId(
    blockExercise.exercise_id,
    overrides,
    blockExercise.sets,
  );
  if (winnerId === blockExercise.exercise_id)
    return blockExercise.exercise.name;

  const winnerName = Object.values(blockExercise.setVariants).find(
    (v) => v.id === winnerId,
  )?.name;
  if (!winnerName) return blockExercise.exercise.name;
  return nonMatchingCount > 0
    ? `${winnerName} +${nonMatchingCount}`
    : winnerName;
}

/** "Warm Up" → "WU" (first letter of each of the first two words),
 * "Working" → "WO" (single word → its first two letters instead). */
export function abbreviateStyleName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0]![0] + words[1]![0]).toUpperCase();
  return (words[0] ?? "").slice(0, 2).toUpperCase();
}

/**
 * Effective style pill for a placed exercise, resolving its per-set style
 * overrides the same "most common, tie → first" way as resolveDisplayName
 * — but with no "+N" suffix, just the winning style's abbreviation. Null
 * when no set (including the placement's own default) has any style at
 * all. `allStyles` resolves the placement's own `style_id` to a name when
 * it wins — it isn't embedded on BlockExerciseWithDetails itself, only
 * per-set overrides carry a resolved ExerciseStyleRow.
 */
export function resolveStylePill(
  blockExercise: BlockExerciseWithDetails,
  allStyles: ExerciseStyleRow[],
): string | null {
  const overrides = Object.fromEntries(
    Object.entries(blockExercise.setStyles).map(([setIndex, style]) => [
      Number(setIndex),
      style?.id ?? NO_STYLE,
    ]),
  );
  const { winnerId } = resolveMostCommonId(
    blockExercise.style_id ?? NO_STYLE,
    overrides,
    blockExercise.sets,
  );
  if (winnerId === NO_STYLE) return null;

  const winnerStyle =
    Object.values(blockExercise.setStyles).find((s) => s?.id === winnerId) ??
    allStyles.find((s) => s.id === winnerId);
  return winnerStyle ? abbreviateStyleName(winnerStyle.name) : null;
}
