"use client";

import { resizeImageToJpeg } from "@/src/lib/imageResize";
import { isYoutubeUrl } from "@/src/lib/videoEmbed";
import { captureVideoThumbnail } from "@/src/lib/videoThumbnailCapture";
import {
  deleteAllExercisePhotos,
  deleteExercisePhotoFiles,
  uploadExercisePhoto,
} from "@/src/services/exercisePhotos.client";
import {
  deleteExerciseVideo,
  deleteExerciseVideoThumbnail,
  uploadExerciseVideo,
  uploadExerciseVideoThumbnail,
} from "@/src/services/exerciseVideo.client";
import type {
  ExercisePhotoRow,
  ExerciseStyleRow,
  ExerciseVideoSource,
  UnitTypeRow,
} from "@hooper/db";
import { useState, type Dispatch, type SetStateAction } from "react";
import type {
  ExerciseFormData,
  ExerciseModalProps,
} from "./exerciseModalTypes";
import {
  draftsFromPhotos,
  photosChanged,
  removedPhotoPaths,
  validatePhotos,
  type PhotoDraft,
  type PhotoRowErrors,
} from "./photoFieldState";
import {
  computeVideoDecision,
  type VideoDecision,
  type VideoFieldState,
} from "./videoDecision";

// Mirrors VideoField's own initial mode/linkUrl so an untouched video field
// resolves to "none"/"set-link" (a no-op) rather than "clear" — otherwise
// saving unrelated fields on an exercise with a link video would wipe it.
function initialVideoState(
  exercise: ExerciseModalProps["exercise"],
): VideoFieldState {
  const isLink = exercise?.video_source === "link";
  return {
    mode: isLink ? "link" : "upload",
    file: null,
    linkUrl: isLink ? (exercise?.video_url ?? "") : "",
    removed: false,
  };
}

function buildFormData(
  name: string,
  description: string,
  categoryIds: string[],
  unitTypeIds: string[],
  parentId: string,
  defaultStyleId: string,
  videoState: VideoFieldState,
  existingSource: ExerciseVideoSource | null,
): ExerciseFormData {
  const decision = computeVideoDecision(videoState, existingSource);
  const base: ExerciseFormData = {
    name: name.trim(),
    description: description.trim(),
    categoryIds,
    unitTypeIds,
    parentId: parentId || null,
    defaultStyleId: defaultStyleId || null,
  };
  if (decision.action === "clear")
    return { ...base, videoUrl: null, videoSource: null };
  if (decision.action === "set-link")
    return { ...base, videoUrl: decision.url, videoSource: "link" };
  return base;
}

/** Best-effort — a coach's save shouldn't fail just because a frame
 * couldn't be captured (unusual codec, etc.); the exercise just falls back
 * to the icon tile on mobile, same as it does today. */
async function captureAndUploadThumbnail(
  exerciseId: string,
  file: File,
  profileId: string,
): Promise<string | null> {
  try {
    const thumbnail = await captureVideoThumbnail(file);
    const result = await uploadExerciseVideoThumbnail(
      exerciseId,
      thumbnail,
      profileId,
    );
    return result.ok ? result.data : null;
  } catch {
    return null;
  }
}

async function persistUploadedVideo(
  exerciseId: string,
  file: File,
  profileId: string,
  updateVideoUrlAction: ExerciseModalProps["updateVideoUrlAction"],
): Promise<string | null> {
  const uploadResult = await uploadExerciseVideo(exerciseId, file, profileId);
  if (!uploadResult.ok) return uploadResult.error ?? "Failed to upload video.";
  const thumbnailUrl = await captureAndUploadThumbnail(
    exerciseId,
    file,
    profileId,
  );
  const urlResult = await updateVideoUrlAction(
    exerciseId,
    uploadResult.data,
    "upload",
    thumbnailUrl,
  );
  return urlResult.ok ? null : (urlResult.error ?? "Failed to save video.");
}

// The old file is only ever orphaned when it's being replaced or removed
// ("none" means the existing upload was left untouched) — clean it up before
// writing a replacement so a different-extension re-upload can't leave two
// files behind.
async function syncExerciseVideo(
  exerciseId: string,
  existingSource: ExerciseVideoSource | null,
  decision: VideoDecision,
  videoState: VideoFieldState,
  profileId: string,
  updateVideoUrlAction: ExerciseModalProps["updateVideoUrlAction"],
): Promise<string | null> {
  if (existingSource === "upload" && decision.action !== "none") {
    await deleteExerciseVideo(exerciseId, profileId);
    await deleteExerciseVideoThumbnail(exerciseId, profileId);
  }
  if (decision.action === "upload-pending" && videoState.file) {
    return persistUploadedVideo(
      exerciseId,
      videoState.file,
      profileId,
      updateVideoUrlAction,
    );
  }
  return null;
}

/** Uploads newly picked photos, then replaces the exercise's photo rows with
 * the final ordered list. Old files are only deleted once the rows no longer
 * point at them; on failure, the files this save uploaded are cleaned up
 * instead so nothing is orphaned. */
async function syncExercisePhotos(
  exerciseId: string,
  initial: ExercisePhotoRow[],
  drafts: PhotoDraft[],
  profileId: string,
  replacePhotosAction: ExerciseModalProps["replacePhotosAction"],
): Promise<string | null> {
  if (!photosChanged(initial, drafts)) return null;

  const uploaded: string[] = [];
  const fail = async (message: string) => {
    await deleteExercisePhotoFiles(uploaded);
    return message;
  };

  const photos: { storagePath: string; caption: string }[] = [];
  for (const draft of drafts) {
    let storagePath = draft.storagePath;
    if (draft.file) {
      let blob: Blob;
      try {
        blob = await resizeImageToJpeg(draft.file);
      } catch {
        return fail(
          "One of the photos couldn't be read. Try a different image.",
        );
      }
      const result = await uploadExercisePhoto(exerciseId, blob, profileId);
      if (!result.ok) return fail(result.error ?? "Failed to upload photo.");
      uploaded.push(result.data);
      storagePath = result.data;
    }
    if (!storagePath) return fail("Each photo needs an image.");
    photos.push({ storagePath, caption: draft.caption.trim() });
  }

  const result = await replacePhotosAction(exerciseId, photos);
  if (!result.ok) return fail(result.error ?? "Failed to save photos.");

  await deleteExercisePhotoFiles(removedPhotoPaths(initial, drafts));
  return null;
}

type FormFields = {
  name: string;
  description: string;
  categoryIds: string[];
  unitTypeIds: string[];
  parentId: string;
  defaultStyleId: string;
  videoState: VideoFieldState;
  photos: PhotoDraft[];
};

type SaveSetters = {
  setNameError: Dispatch<SetStateAction<string | undefined>>;
  setShowPhotoErrors: Dispatch<SetStateAction<boolean>>;
  setSaving: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
};

function photoErrorMessage(count: number): string {
  return count === 1
    ? "A photo is missing its image or caption — fill it in or remove it."
    : `${count} photos are missing an image or caption — fill them in or remove them.`;
}

/** Client-side checks before anything is written. Every failing check is
 * surfaced at once (name + photos), so the coach isn't drip-fed errors. */
function validateBeforeSave(
  fields: FormFields,
  existingSource: ExerciseVideoSource | null,
  setters: SaveSetters,
): boolean {
  const { setNameError, setShowPhotoErrors, setError } = setters;
  const nameMissing = !fields.name.trim();
  setNameError(nameMissing ? "Exercise name is required" : undefined);

  const photoErrorCount = Object.keys(validatePhotos(fields.photos)).length;
  if (photoErrorCount > 0) {
    setShowPhotoErrors(true);
    setError(photoErrorMessage(photoErrorCount));
    // The photo list sits below the video in a scrolling column, so the
    // flagged rows are usually off-screen — bring the first one into view
    // once the error styling has rendered.
    requestAnimationFrame(() =>
      document
        .querySelector("[data-photo-invalid]")
        ?.scrollIntoView({ block: "center", behavior: "smooth" }),
    );
    return false;
  }
  if (nameMissing) return false;

  const videoDecision = computeVideoDecision(fields.videoState, existingSource);
  if (videoDecision.action === "set-link" && !isYoutubeUrl(videoDecision.url)) {
    setError(
      "Enter a YouTube link (youtube.com or youtu.be) for the demo video.",
    );
    return false;
  }
  return true;
}

/** Video then photos — both need the exercise row to exist first (a new
 * exercise only gets its id from the create action). */
async function syncExerciseMedia(
  props: ExerciseModalProps,
  exerciseId: string,
  fields: FormFields,
): Promise<string | null> {
  const existingSource = props.exercise?.video_source ?? null;
  const videoError = await syncExerciseVideo(
    exerciseId,
    existingSource,
    computeVideoDecision(fields.videoState, existingSource),
    fields.videoState,
    props.profileId,
    props.updateVideoUrlAction,
  );
  if (videoError) return videoError;
  return syncExercisePhotos(
    exerciseId,
    props.exercise?.photos ?? [],
    fields.photos,
    props.profileId,
    props.replacePhotosAction,
  );
}

async function runSave(
  props: ExerciseModalProps,
  fields: FormFields,
  setters: SaveSetters,
): Promise<void> {
  const { mode, exercise, onSave, createAction, updateAction } = props;
  const {
    name,
    description,
    categoryIds,
    unitTypeIds,
    parentId,
    defaultStyleId,
    videoState,
  } = fields;
  const { setSaving, setError } = setters;

  const existingSource = exercise?.video_source ?? null;
  if (!validateBeforeSave(fields, existingSource, setters)) return;

  setSaving(true);
  setError(null);

  const formData = buildFormData(
    name,
    description,
    categoryIds,
    unitTypeIds,
    parentId,
    defaultStyleId,
    videoState,
    existingSource,
  );
  const result =
    mode === "create"
      ? await createAction(formData)
      : await updateAction(exercise!.id, formData);

  if (!result.ok) {
    setError(result.error ?? "Failed to save exercise.");
    setSaving(false);
    return;
  }

  const exerciseId = mode === "create" ? result.id : exercise!.id;
  const mediaError = exerciseId
    ? await syncExerciseMedia(props, exerciseId, fields)
    : null;
  if (mediaError) {
    setError(mediaError);
    setSaving(false);
    return;
  }

  setSaving(false);
  onSave();
}

async function runDelete(
  props: ExerciseModalProps,
  setters: Pick<SaveSetters, "setSaving" | "setError">,
): Promise<void> {
  const { exercise, deleteAction, profileId, onDelete } = props;
  const { setSaving, setError } = setters;
  if (!exercise || !deleteAction) return;

  setSaving(true);
  const result = await deleteAction(exercise.id);
  if (!result.ok) {
    setError(result.error ?? "Failed to delete.");
    setSaving(false);
    return;
  }
  if (exercise.video_source === "upload") {
    await deleteExerciseVideo(exercise.id, profileId);
    await deleteExerciseVideoThumbnail(exercise.id, profileId);
  }
  if (exercise.photos.length > 0)
    await deleteAllExercisePhotos(exercise.id, profileId);
  onDelete?.();
}

export function useExerciseModalForm(props: ExerciseModalProps) {
  const { exercise, lockedParentId } = props;
  const [name, setName] = useState(exercise?.name ?? "");
  const [description, setDescription] = useState(exercise?.description ?? "");
  const [categoryIds, setCategoryIds] = useState<string[]>(
    exercise?.categories.map((c) => c.id) ?? [],
  );
  const [unitTypeIds, setUnitTypeIds] = useState<string[]>(
    exercise?.unitTypeIds ?? [],
  );
  const [parentId, setParentId] = useState<string>(
    lockedParentId ?? exercise?.parent_id ?? "",
  );
  const [defaultStyleId, setDefaultStyleId] = useState<string>(
    exercise?.default_style_id ?? "",
  );
  const [styles, setStyles] = useState<ExerciseStyleRow[]>(props.styles);
  const [unitTypes, setUnitTypes] = useState<UnitTypeRow[]>(props.unitTypes);
  const [videoState, setVideoState] = useState<VideoFieldState>(() =>
    initialVideoState(exercise),
  );
  const [photos, setPhotos] = useState<PhotoDraft[]>(() =>
    draftsFromPhotos(exercise?.photos ?? []),
  );
  const [showPhotoErrors, setShowPhotoErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | undefined>();

  function addStyle(style: ExerciseStyleRow) {
    setStyles((prev) => [...prev, style]);
  }

  function addUnitType(unitType: UnitTypeRow) {
    setUnitTypes((prev) => [...prev, unitType]);
  }

  const handleSave = () =>
    runSave(
      props,
      {
        name,
        description,
        categoryIds,
        unitTypeIds,
        parentId,
        defaultStyleId,
        videoState,
        photos,
      },
      { setNameError, setShowPhotoErrors, setSaving, setError },
    );

  // Errors stay hidden until the first save attempt, then track edits live
  // so a fixed row clears immediately.
  const photoErrors: Record<string, PhotoRowErrors> | undefined =
    showPhotoErrors ? validatePhotos(photos) : undefined;

  const handleDelete = () => runDelete(props, { setSaving, setError });

  return {
    name,
    setName,
    description,
    setDescription,
    categoryIds,
    setCategoryIds,
    unitTypeIds,
    setUnitTypeIds,
    parentId,
    setParentId,
    defaultStyleId,
    setDefaultStyleId,
    styles,
    addStyle,
    unitTypes,
    addUnitType,
    setVideoState,
    photos,
    setPhotos,
    photoErrors,
    saving,
    error,
    nameError,
    handleSave,
    handleDelete,
  };
}
