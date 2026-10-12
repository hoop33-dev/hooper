import { getYoutubeVideoId } from "./youtube";

/** Mirrors the host-parsing in apps/web/src/lib/videoEmbed.ts's getEmbedUrl —
 * that file isn't importable from mobile, so the YouTube-id extraction is
 * duplicated here. Only YouTube exposes a thumbnail from the video id alone;
 * Vimeo and raw uploads have no deterministic thumbnail URL, so they fall
 * back to the icon tile instead of an image. */
export function getVideoThumbnailUrl(url: string): string | null {
  const id = getYoutubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
