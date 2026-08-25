/** Extracts a YouTube video id from a youtube.com/m.youtube.com/youtu.be URL
 * (including /shorts/ links), or null if the URL isn't a recognized YouTube
 * link. Shared by the thumbnail helper (videoThumbnail.ts) and the in-app
 * player, which both need the bare id rather than the full URL. */
export function getYoutubeVideoId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = parsed.searchParams.get("v");
    if (id) return id;
    const shortsMatch = parsed.pathname.match(/^\/shorts\/([^/]+)/);
    return shortsMatch ? shortsMatch[1] : null;
  }

  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1);
    return id || null;
  }

  return null;
}
