type Entry<T> = { data: T; expiresAt: number };

/**
 * Module-scoped read-through cache for global reference tables (exercise
 * categories / styles / unit types / regions) — rows that are identical for
 * every coach and change only through the catalog-management screens.
 *
 * The value persists across requests for as long as the serverless instance
 * stays warm, so navigating between the program / session / exercise pages
 * stops re-querying the same handful of rows every time. React `cache()` still
 * wraps the readers on top for per-render dedup.
 *
 * `invalidate()` only clears the instance that runs it; other warm instances
 * fall back to the TTL. Acceptable because catalog edits are rare — see the
 * caching plan for the `unstable_cache` + `revalidateTag` escalation path.
 */
export function moduleTtlCache<T>(load: () => Promise<T>, ttlMs = 2 * 60_000) {
  let entry: Entry<T> | null = null;
  let inflight: Promise<T> | null = null;
  // Bumped on every invalidate(); a load that started before the bump must not
  // publish its (now stale) result or clear a newer in-flight request.
  let generation = 0;

  async function loadAndStore(): Promise<T> {
    const startedAt = generation;
    try {
      const data = await load();
      if (startedAt === generation) {
        entry = { data, expiresAt: Date.now() + ttlMs };
      }
      return data;
    } finally {
      // Only clear the slot if a newer load hasn't already claimed it.
      if (startedAt === generation) inflight = null;
    }
  }

  return {
    async get(): Promise<T> {
      if (entry && entry.expiresAt > Date.now()) return entry.data;
      inflight ??= loadAndStore();
      return inflight;
    },
    invalidate() {
      entry = null;
      inflight = null;
      generation++;
    },
  };
}
