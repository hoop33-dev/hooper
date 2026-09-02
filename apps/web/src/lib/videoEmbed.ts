/** Parses a video link into an embeddable iframe URL, if the host supports it. */
export function getEmbedUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = parsed.searchParams.get("v");
    if (id) return `https://www.youtube.com/embed/${id}`;
    const shortsMatch = parsed.pathname.match(/^\/shorts\/([^/]+)/);
    return shortsMatch
      ? `https://www.youtube.com/embed/${shortsMatch[1]}`
      : null;
  }

  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (host === "vimeo.com") {
    const id = parsed.pathname.slice(1).split("/")[0];
    return id && /^\d+$/.test(id)
      ? `https://player.vimeo.com/video/${id}`
      : null;
  }

  return null;
}

/** Returns a static thumbnail image for hosts that expose one without an API call (YouTube only). */
export function getThumbnailUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = parsed.searchParams.get("v");
    const shortsMatch = parsed.pathname.match(/^\/shorts\/([^/]+)/);
    const videoId = id ?? shortsMatch?.[1];
    return videoId
      ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
      : null;
  }

  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1);
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
  }

  return null;
}

/** A real YouTube video id is exactly 11 URL-safe characters. */
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extracts the video id from a youtube.com / m.youtube.com / youtu.be link
 * (watch, youtu.be, or /shorts/ form), or null if the URL isn't a well-formed
 * YouTube link. Used to enforce YouTube-only exercise demo videos.
 */
export function getYoutubeVideoId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "");
  let id: string | null = null;

  if (host === "youtube.com" || host === "m.youtube.com") {
    id =
      parsed.searchParams.get("v") ??
      parsed.pathname.match(/^\/shorts\/([^/]+)/)?.[1] ??
      null;
  } else if (host === "youtu.be") {
    id = parsed.pathname.slice(1) || null;
  }

  return id && YOUTUBE_ID.test(id) ? id : null;
}

/** Only YouTube links are accepted as an exercise's demo video. */
export function isYoutubeUrl(url: string): boolean {
  return getYoutubeVideoId(url) !== null;
}
