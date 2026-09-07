import { getDescendantIds } from "@/src/lib/categoryTree";
import type { ExerciseCategoryRow, ExerciseWithDetails } from "@hooper/db";

/** True if every character of `query` appears in `text` in order (not
 * necessarily contiguous) — the last-resort fuzzy tier, e.g. "ltrl" inside
 * "lateral". */
function isSubsequence(query: string, text: string): boolean {
  let i = 0;
  for (let j = 0; j < text.length && i < query.length; j++) {
    if (text[j] === query[i]) i++;
  }
  return i === query.length;
}

/** Scores how well an exercise name matches a search query, so results can
 * be ranked by closeness instead of just included/excluded — an exact or
 * prefix match ranks above a mere word match, which ranks above a fuzzy
 * subsequence match ("lats" finding "Lateral Raises" via the word tier).
 * Returns null when the query doesn't match at all. */
export function scoreMatch(name: string, query: string): number | null {
  const n = name.toLowerCase();
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  if (n === q) return 4;
  if (n.startsWith(q)) return 3;
  if (n.split(/\s+/).some((word) => word.startsWith(q))) return 2;
  if (isSubsequence(q, n)) return 1;
  return null;
}

export function filterExercises(
  exercises: ExerciseWithDetails[],
  search: string,
  categoryId: string,
  categories: ExerciseCategoryRow[] = [],
): ExerciseWithDetails[] {
  const categoryIds = categoryId
    ? new Set([categoryId, ...getDescendantIds(categoryId, categories)])
    : null;
  return exercises
    .filter(
      (ex) => !categoryIds || ex.categories.some((c) => categoryIds.has(c.id)),
    )
    .map((ex) => ({ ex, score: scoreMatch(ex.name, search) }))
    .filter(
      (r): r is { ex: ExerciseWithDetails; score: number } => r.score !== null,
    )
    .sort((a, b) => b.score - a.score)
    .map((r) => r.ex);
}
