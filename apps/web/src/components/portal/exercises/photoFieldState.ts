import { EXERCISE_PHOTO_CAPTION_MAX } from "@/src/lib/exercisePhotos";
import type { ExercisePhotoRow } from "@hooper/db";

/** One row in the edit modal's photo list. A row either points at an
 * already-stored photo (`storagePath`) or holds a newly picked `file` to
 * upload on save — picking a replacement image swaps the former for the
 * latter. A row with neither is a blank, just-added row. */
export type PhotoDraft = {
  key: string;
  storagePath: string | null;
  file: File | null;
  /** The stored photo's public URL, or an object URL for a picked file. */
  previewUrl: string | null;
  caption: string;
};

export type PhotoRowErrors = { image?: string; caption?: string };

export function draftsFromPhotos(photos: ExercisePhotoRow[]): PhotoDraft[] {
  return photos.map((p) => ({
    key: p.id,
    storagePath: p.storage_path,
    file: null,
    previewUrl: p.url,
    caption: p.caption,
  }));
}

export function rowHasImage(draft: PhotoDraft): boolean {
  return draft.file !== null || draft.storagePath !== null;
}

/** Every added row must have both an image and a caption — keyed by
 * draft.key, with only the failing rows present. Empty means valid. */
export function validatePhotos(
  drafts: PhotoDraft[],
): Record<string, PhotoRowErrors> {
  const errors: Record<string, PhotoRowErrors> = {};
  for (const draft of drafts) {
    const rowErrors: PhotoRowErrors = {};
    if (!rowHasImage(draft)) rowErrors.image = "Add a photo or remove this row";
    const caption = draft.caption.trim();
    if (!caption) rowErrors.caption = "Caption is required";
    else if (caption.length > EXERCISE_PHOTO_CAPTION_MAX)
      rowErrors.caption = `Keep it to ${EXERCISE_PHOTO_CAPTION_MAX} characters`;
    if (rowErrors.image || rowErrors.caption) errors[draft.key] = rowErrors;
  }
  return errors;
}

/** Stored files no longer referenced after this save — removed rows and
 * rows whose image was replaced. Deleted only once the new rows are saved. */
export function removedPhotoPaths(
  initial: ExercisePhotoRow[],
  drafts: PhotoDraft[],
): string[] {
  const kept = new Set(drafts.map((d) => d.storagePath).filter(Boolean));
  return initial.map((p) => p.storage_path).filter((path) => !kept.has(path));
}

/** Whether the photo list differs from what's stored — lets an untouched
 * list skip the photos round-trip on save. */
export function photosChanged(
  initial: ExercisePhotoRow[],
  drafts: PhotoDraft[],
): boolean {
  if (initial.length !== drafts.length) return true;
  return drafts.some((d, i) => {
    const p = initial[i];
    return (
      d.file !== null ||
      d.storagePath !== p.storage_path ||
      d.caption.trim() !== p.caption
    );
  });
}
