"use client";

import type { UnitType } from "@/src/constants/unitTypes";
import {
  deleteExerciseVideo,
  uploadExerciseVideo,
} from "@/src/services/exerciseVideo.client";
import type { ExerciseVideoSource } from "@hooper/db";
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
  unitTypes: UnitType[],
  videoState: VideoFieldState,
  existingSource: ExerciseVideoSource | null,
): ExerciseFormData {
  const decision = computeVideoDecision(videoState, existingSource);
  const base: ExerciseFormData = {
    name: name.trim(),
    description: description.trim(),
    categoryIds,
    unitTypes,
  };
  if (decision.action === "clear")
    return { ...base, videoUrl: null, videoSource: null };
  if (decision.action === "set-link")
    return { ...base, videoUrl: decision.url, videoSource: "link" };
  return base;
}

async function persistUploadedVideo(
  exerciseId: string,
  file: File,
  profileId: string,
  updateVideoUrlAction: ExerciseModalProps["updateVideoUrlAction"],
): Promise<string | null> {
  const uploadResult = await uploadExerciseVideo(exerciseId, file, profileId);
  if (!uploadResult.ok) return uploadResult.error ?? "Failed to upload video.";
  const urlResult = await updateVideoUrlAction(
    exerciseId,
    uploadResult.data,
    "upload",
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
  unitTypes: UnitType[];
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
  const { name, description, categoryIds, unitTypes, videoState } = fields;
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
    unitTypes,
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
  }
  onDelete?.();
}

export function useExerciseModalForm(props: ExerciseModalProps) {
  const { exercise } = props;
  const [name, setName] = useState(exercise?.name ?? "");
  const [description, setDescription] = useState(exercise?.description ?? "");
  const [categoryIds, setCategoryIds] = useState<string[]>(
    exercise?.categories.map((c) => c.id) ?? [],
  );
  const [unitTypes, setUnitTypes] = useState<UnitType[]>(
    (exercise?.unitTypes ?? []) as UnitType[],
  );
  const [videoState, setVideoState] = useState<VideoFieldState>(() =>
    initialVideoState(exercise),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | undefined>();

  const handleSave = () =>
    runSave(
      props,
      { name, description, categoryIds, unitTypes, videoState },
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
    unitTypes,
    setUnitTypes,
    setVideoState,
    saving,
    error,
    nameError,
    handleSave,
    handleDelete,
  };
}
