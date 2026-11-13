import type { AthleteExercise } from "@hooper/api";
import type { ExerciseVideoSource } from "@hooper/db";

import { getVideoThumbnailUrl } from "./videoThumbnail";

export type ExerciseMediaVideo = {
  kind: "video";
  key: string;
  url: string;
  source: ExerciseVideoSource;
  thumbnailUrl: string | null;
};

type ExerciseMediaPhoto = {
  kind: "photo";
  key: string;
  url: string;
  caption: string;
  /** 1-based, among photos only — "Photo 2 of 5". */
  n: number;
};

export type ExerciseMediaItem = ExerciseMediaVideo | ExerciseMediaPhoto;

/** An exercise's media in viewer order: the demo video (if any) first, then
 * its photos by position — the order the coach portal shows them in. */
export function exerciseMediaItems(
  exercise: AthleteExercise,
): ExerciseMediaItem[] {
  const items: ExerciseMediaItem[] = [];
  if (exercise.video_url) {
    const source = exercise.video_source ?? "upload";
    items.push({
      kind: "video",
      key: "video",
      url: exercise.video_url,
      source,
      // Uploads carry a thumbnail captured at upload time; YouTube links
      // derive one from the video id.
      thumbnailUrl:
        source === "link"
          ? getVideoThumbnailUrl(exercise.video_url)
          : exercise.video_thumbnail_url,
    });
  }
  exercise.photos.forEach((p, i) =>
    items.push({
      kind: "photo",
      key: p.id,
      url: p.url,
      caption: p.caption,
      n: i + 1,
    }),
  );
  return items;
}

/** The image a media item is previewed with (tiles, strip, idle video page). */
export function mediaPreviewUrl(item: ExerciseMediaItem): string | null {
  return item.kind === "video" ? item.thumbnailUrl : item.url;
}
