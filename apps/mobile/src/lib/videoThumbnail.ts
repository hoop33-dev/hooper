/** Mirrors the host-parsing in apps/web/src/lib/videoEmbed.ts's getEmbedUrl —
 * that file isn't importable from mobile, so the YouTube-id extraction is
 * duplicated here. Only YouTube exposes a thumbnail from the video id alone;
 * Vimeo and raw uploads have no deterministic thumbnail URL, so they fall
 * back to the icon tile instead of an image. */
export function getVideoThumbnailUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = parsed.searchParams.get("v");
    if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    const shortsMatch = parsed.pathname.match(/^\/shorts\/([^/]+)/);
    return shortsMatch ? `https://img.youtube.com/vi/${shortsMatch[1]}/hqdefault.jpg` : null;
  }

  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  }

  return null;
}
