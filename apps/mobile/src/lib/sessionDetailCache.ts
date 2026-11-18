import type { AthleteSessionDetail } from "@hooper/api";

/** The last-fetched block/exercise tree per session, kept in memory so the
 * preview -> player -> summary hop doesn't refetch the same (large, nested)
 * session three times. The preview always fetches fresh and overwrites its
 * entry, so the player starts from data at most as old as the preview the
 * athlete just looked at. */
const cache = new Map<string, AthleteSessionDetail>();

export function cacheSessionDetail(session: AthleteSessionDetail): void {
  cache.set(session.id, session);
}

export function getCachedSessionDetail(
  sessionId: string,
): AthleteSessionDetail | undefined {
  return cache.get(sessionId);
}
