import type { ExerciseVideoOrientation, ExerciseVideoSource } from "@hooper/db";

/** Classifies a "link" video's orientation via YouTube's oEmbed endpoint, so
 * the mobile player (always a portrait frame) knows up front whether to
 * rotate the video to fill it. Returns null on any failure — a non-YouTube
 * host, a network error, or a malformed response — rather than throwing:
 * an orientation lookup must never block a coach's save, and the player
 * falls back to treating null as landscape. */
export async function computeVideoOrientation(
  videoUrl: string,
  videoSource: ExerciseVideoSource | null,
): Promise<ExerciseVideoOrientation | null> {
  if (videoSource !== "link") return null;

  try {
    // Hard cap the round trip — Node's fetch has no default timeout, and a
    // slow / rate-limited / unreachable oembed endpoint would otherwise
    // block the coach's save until the socket eventually gives up. The
    // AbortError lands in the catch below and resolves to null like any
    // other failure.
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`,
      { signal: AbortSignal.timeout(3000) },
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      thumbnail_width?: number;
      thumbnail_height?: number;
    };
    if (!data.thumbnail_width || !data.thumbnail_height) return null;

    return data.thumbnail_width >= data.thumbnail_height
      ? "landscape"
      : "portrait";
  } catch {
    return null;
  }
}
