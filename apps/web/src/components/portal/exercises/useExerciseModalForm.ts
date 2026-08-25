"use client";

import { captureVideoThumbnail } from "@/src/lib/videoThumbnailCapture";
import {
  deleteExerciseVideo,
  deleteExerciseVideoThumbnail,
  uploadExerciseVideo,
  uploadExerciseVideoThumbnail,
} from "@/src/services/exerciseVideo.client";
import type {
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

type FormFields = {
  name: string;
  description: string;
  categoryIds: string[];
  unitTypeIds: string[];
  parentId: string;
  defaultStyleId: string;
  videoState: VideoFieldState;
};

type SaveSetters = {
  setNameError: Dispatch<SetStateAction<string | undefined>>;
  setSaving: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
};

async function runSave(
  props: ExerciseModalProps,
  fields: FormFields,
  setters: SaveSetters,
): Promise<void> {
  const {
    mode,
    exercise,
    profileId,
    onSave,
    createAction,
    updateAction,
    updateVideoUrlAction,
  } = props;
  const {
    name,
    description,
    categoryIds,
    unitTypeIds,
    parentId,
    defaultStyleId,
    videoState,
  } = fields;
  const { setNameError, setSaving, setError } = setters;

  if (!name.trim()) {
    setNameError("Exercise name is required");
    return;
  }
  setNameError(undefined);
  setSaving(true);
  setError(null);

  const existingSource = exercise?.video_source ?? null;
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
  const decision = computeVideoDecision(videoState, existingSource);
  const videoError = exerciseId
    ? await syncExerciseVideo(
        exerciseId,
        existingSource,
        decision,
        videoState,
        profileId,
        updateVideoUrlAction,
      )
    : null;
  if (videoError) {
    setError(videoError);
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
      },
      { setNameError, setSaving, setError },
    );

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
    saving,
    error,
    nameError,
    handleSave,
    handleDelete,
  };
}
