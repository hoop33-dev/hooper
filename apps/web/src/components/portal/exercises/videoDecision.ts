import type { ExerciseVideoSource } from "@hooper/db";

export type VideoFieldState = {
  mode: ExerciseVideoSource;
  file: File | null;
  linkUrl: string;
  removed: boolean;
};

export type VideoDecision =
  | { action: "none" }
  | { action: "clear" }
  | { action: "set-link"; url: string }
  | { action: "upload-pending" };

/**
 * A video is either an upload or a link, never both — this resolves the
 * form's tab/file/link/removed state into the single change to persist.
 * "none" leaves whatever video is already stored on the exercise untouched
 * (e.g. editing unrelated fields without touching the video tab).
 */
export function computeVideoDecision(
  state: VideoFieldState,
  existingSource: ExerciseVideoSource | null,
): VideoDecision {
  if (state.removed) return { action: "clear" };

  if (state.mode === "link") {
    const trimmed = state.linkUrl.trim();
    return trimmed ? { action: "set-link", url: trimmed } : { action: "clear" };
  }

  if (state.file) return { action: "upload-pending" };
  return existingSource === "upload" ? { action: "none" } : { action: "clear" };
}

/**
 * Warns before a tab switch that would discard the exercise's current video —
 * e.g. pasting a link over an uploaded video, or opening the upload tab on an
 * exercise that only has a link (which clears it unless a file is picked).
 */
export function getVideoSwitchWarning(
  mode: ExerciseVideoSource,
  existingSource: ExerciseVideoSource | null,
  existingUrl: string | null | undefined,
): string | null {
  if (!existingSource || !existingUrl || mode === existingSource) return null;
  return mode === "link"
    ? "This exercise has an uploaded video. Saving now will replace it with this link."
    : "This exercise has a linked video. Saving now will replace it with an uploaded file (or remove it if you don't upload one).";
}
