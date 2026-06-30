"use client";

import { useState, useEffect } from "react";
import type { ExerciseCategoryRow, ExerciseWithDetails } from "@hooper/db";
import type { UnitType } from "@/src/constants/unitTypes";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput, PortalTextarea } from "../ui/PortalInput";
import { UnitTypeSelector } from "./UnitTypeSelector";
import { CategoryCombobox } from "./CategoryCombobox";
import { VideoUploadZone } from "./VideoUploadZone";

interface ExerciseModalProps {
  mode: "create" | "edit";
  exercise?: ExerciseWithDetails;
  categories: ExerciseCategoryRow[];
  profileId: string;
  onSave: () => void;
  onClose: () => void;
  onDelete?: () => void;
  createAction: (data: ExerciseFormData) => Promise<{ ok: boolean; error?: string }>;
  updateAction: (id: string, data: ExerciseFormData) => Promise<{ ok: boolean; error?: string }>;
  deleteAction?: (id: string) => Promise<{ ok: boolean; error?: string }>;
  uploadVideoAction: (exerciseId: string, file: File, profileId: string) => Promise<{ ok: boolean; error?: string }>;
}

export type ExerciseFormData = {
  name: string;
  description: string;
  categoryIds: string[];
  unitTypes: UnitType[];
};

function useEscapeKey(onClose: () => void) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
}

function ExerciseFormFields({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  error,
}: {
  name: string;
  description: string;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <PortalInput
        id="exercise-name"
        label="Exercise name"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="e.g. Romanian Deadlift"
        error={error}
        required
      />
      <PortalTextarea
        id="exercise-description"
        label="Coaching cues / description"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Key technique points, setup cues…"
        rows={5}
      />
    </div>
  );
}

function DeleteZone({ onDelete }: { onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
        <span className="flex-1 text-sm text-red-700">Delete this exercise?</span>
        <PortalButton variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Cancel
        </PortalButton>
        <PortalButton variant="danger" size="sm" onClick={onDelete}>
          Delete
        </PortalButton>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-xs font-semibold text-red-500 hover:underline"
    >
      Delete exercise
    </button>
  );
}

export function ExerciseModal(props: ExerciseModalProps) {
  const {
    mode, exercise, categories, profileId, onSave, onClose, onDelete,
    createAction, updateAction, deleteAction, uploadVideoAction,
  } = props;
  const [name, setName] = useState(exercise?.name ?? "");
  const [description, setDescription] = useState(exercise?.description ?? "");
  const [categoryIds, setCategoryIds] = useState<string[]>(exercise?.categories.map((c) => c.id) ?? []);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>((exercise?.unitTypes ?? []) as UnitType[]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | undefined>();

  useEscapeKey(onClose);

  async function handleSave() {
    if (!name.trim()) {
      setNameError("Exercise name is required");
      return;
    }
    setNameError(undefined);
    setSaving(true);
    setError(null);

    const formData: ExerciseFormData = {
      name: name.trim(),
      description: description.trim(),
      categoryIds,
      unitTypes,
    };

    const result =
      mode === "create"
        ? await createAction(formData)
        : await updateAction(exercise!.id, formData);

    if (!result.ok) {
      setError(result.error ?? "Failed to save exercise.");
      setSaving(false);
      return;
    }

    const exerciseId = exercise?.id;
    if (videoFile && exerciseId) {
      await uploadVideoAction(exerciseId, videoFile, profileId);
    }

    setSaving(false);
    onSave();
  }

  async function handleDelete() {
    if (!exercise || !deleteAction) return;
    setSaving(true);
    const result = await deleteAction(exercise.id);
    if (!result.ok) {
      setError(result.error ?? "Failed to delete.");
      setSaving(false);
      return;
    }
    onDelete?.();
  }

  return (
    <ModalLayout
      mode={mode}
      onClose={onClose}
      name={name}
      description={description}
      nameError={nameError}
      onNameChange={setName}
      onDescriptionChange={setDescription}
      categories={categories}
      categoryIds={categoryIds}
      onCategoryChange={setCategoryIds}
      videoUrl={exercise?.video_url}
      onFileSelect={setVideoFile}
      unitTypes={unitTypes}
      onUnitTypesChange={setUnitTypes}
      error={error}
      deleteAction={deleteAction}
      onDelete={handleDelete}
      saving={saving}
      onSave={handleSave}
    />
  );
}

function ModalLayout({
  mode,
  onClose,
  name,
  description,
  nameError,
  onNameChange,
  onDescriptionChange,
  categories,
  categoryIds,
  onCategoryChange,
  videoUrl,
  onFileSelect,
  unitTypes,
  onUnitTypesChange,
  error,
  deleteAction,
  onDelete,
  saving,
  onSave,
}: {
  mode: "create" | "edit";
  onClose: () => void;
  name: string;
  description: string;
  nameError?: string;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  categories: ExerciseCategoryRow[];
  categoryIds: string[];
  onCategoryChange: (ids: string[]) => void;
  videoUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  unitTypes: UnitType[];
  onUnitTypesChange: (types: UnitType[]) => void;
  error: string | null;
  deleteAction?: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onDelete: () => void;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-portal-card shadow-2xl">
        <ModalHeader mode={mode} onClose={onClose} />
        <ModalColumnBody
          name={name}
          description={description}
          nameError={nameError}
          onNameChange={onNameChange}
          onDescriptionChange={onDescriptionChange}
          categories={categories}
          categoryIds={categoryIds}
          onCategoryChange={onCategoryChange}
          videoUrl={videoUrl}
          onFileSelect={onFileSelect}
        />
        <ModalFooter
          unitTypes={unitTypes}
          onUnitTypesChange={onUnitTypesChange}
          error={error}
          mode={mode}
          deleteAction={deleteAction}
          onDelete={onDelete}
          onClose={onClose}
          saving={saving}
          onSave={onSave}
        />
      </div>
    </div>
  );
}

function ModalColumnBody({
  name,
  description,
  nameError,
  onNameChange,
  onDescriptionChange,
  categories,
  categoryIds,
  onCategoryChange,
  videoUrl,
  onFileSelect,
}: {
  name: string;
  description: string;
  nameError?: string;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  categories: ExerciseCategoryRow[];
  categoryIds: string[];
  onCategoryChange: (ids: string[]) => void;
  videoUrl?: string | null;
  onFileSelect: (file: File | null) => void;
}) {
  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto border-r border-portal-border p-6">
        <ExerciseFormFields
          name={name}
          description={description}
          onNameChange={onNameChange}
          onDescriptionChange={onDescriptionChange}
          error={nameError}
        />
        <CategoryCombobox
          categories={categories}
          selected={categoryIds}
          onChange={onCategoryChange}
        />
      </div>

      <div className="flex w-72 flex-shrink-0 flex-col gap-5 overflow-y-auto p-6">
        <VideoUploadZone currentUrl={videoUrl} onFileSelect={onFileSelect} />
      </div>
    </div>
  );
}

function ModalFooter({
  unitTypes,
  onUnitTypesChange,
  error,
  mode,
  deleteAction,
  onDelete,
  onClose,
  saving,
  onSave,
}: {
  unitTypes: UnitType[];
  onUnitTypesChange: (types: UnitType[]) => void;
  error: string | null;
  mode: "create" | "edit";
  deleteAction?: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onDelete: () => void;
  onClose: () => void;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-portal-border p-4">
      <UnitTypeSelector selected={unitTypes} onChange={onUnitTypesChange} />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center justify-between">
        <div>
          {mode === "edit" && deleteAction && <DeleteZone onDelete={onDelete} />}
        </div>
        <div className="flex gap-2">
          <PortalButton variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </PortalButton>
          <PortalButton variant="primary" onClick={onSave} disabled={saving}>
            {saving ? "Saving…" : mode === "create" ? "Create exercise" : "Save changes"}
          </PortalButton>
        </div>
      </div>
    </div>
  );
}

function ModalHeader({ mode, onClose }: { mode: "create" | "edit"; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-portal-border px-6 py-4">
      <h2 className="font-title text-lg font-extrabold tracking-wide text-portal-text1">
        {mode === "create" ? "Create exercise" : "Edit exercise"}
      </h2>
      <button
        type="button"
        onClick={onClose}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-portal-text3 hover:bg-portal-bg hover:text-portal-text1"
      >
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}
