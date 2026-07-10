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

/** A video link only needs to be a well-formed http(s) URL — not every host is embeddable. */
export function isValidVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
