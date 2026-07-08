"use client";

import type { UnitType } from "@/src/constants/unitTypes";
import type { ExerciseCategoryRow, ExerciseVideoSource } from "@hooper/db";
import type { MouseEvent } from "react";
import { InlineConfirmDeleteBar } from "../ui/InlineConfirmDeleteBar";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput, PortalTextarea } from "../ui/PortalInput";
import { useModalDismiss } from "../ui/useModalDismiss";
import { CategoryCombobox } from "./CategoryCombobox";
import { UnitTypeSelector } from "./UnitTypeSelector";
import { VideoField } from "./VideoField";
import type { ActionResult, ExerciseModalProps } from "./exerciseModalTypes";
import { useExerciseModalForm } from "./useExerciseModalForm";
import type { VideoFieldState } from "./videoDecision";

export type {
  ActionResult,
  ExerciseFormData,
  ExerciseModalProps,
} from "./exerciseModalTypes";

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

export function ExerciseModal(props: ExerciseModalProps) {
  const { mode, exercise, categories, onClose, deleteAction } = props;
  const form = useExerciseModalForm(props);
  const onBackdropClick = useModalDismiss(onClose);

  return (
    <ModalLayout
      mode={mode}
      onClose={onClose}
      onBackdropClick={onBackdropClick}
      name={form.name}
      description={form.description}
      nameError={form.nameError}
      onNameChange={form.setName}
      onDescriptionChange={form.setDescription}
      categories={categories}
      categoryIds={form.categoryIds}
      onCategoryChange={form.setCategoryIds}
      videoUrl={exercise?.video_url}
      videoSource={exercise?.video_source}
      onVideoChange={form.setVideoState}
      unitTypes={form.unitTypes}
      onUnitTypesChange={form.setUnitTypes}
      error={form.error}
      deleteAction={deleteAction}
      onDelete={form.handleDelete}
      saving={form.saving}
      onSave={form.handleSave}
    />
  );
}

function ModalLayout({
  mode,
  onClose,
  onBackdropClick,
  name,
  description,
  nameError,
  onNameChange,
  onDescriptionChange,
  categories,
  categoryIds,
  onCategoryChange,
  videoUrl,
  videoSource,
  onVideoChange,
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
  onBackdropClick: (e: MouseEvent<HTMLDivElement>) => void;
  name: string;
  description: string;
  nameError?: string;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  categories: ExerciseCategoryRow[];
  categoryIds: string[];
  onCategoryChange: (ids: string[]) => void;
  videoUrl?: string | null;
  videoSource?: ExerciseVideoSource | null;
  onVideoChange: (value: VideoFieldState) => void;
  unitTypes: UnitType[];
  onUnitTypesChange: (types: UnitType[]) => void;
  error: string | null;
  deleteAction?: (id: string) => Promise<ActionResult>;
  onDelete: () => void;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-portal-card flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl shadow-2xl">
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
          videoSource={videoSource}
          onVideoChange={onVideoChange}
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
  videoSource,
  onVideoChange,
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
  videoSource?: ExerciseVideoSource | null;
  onVideoChange: (value: VideoFieldState) => void;
}) {
  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="border-portal-border flex flex-1 flex-col gap-5 overflow-y-auto border-r p-6">
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
        <VideoField
          existingUrl={videoUrl}
          existingSource={videoSource}
          onChange={onVideoChange}
        />
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
  deleteAction?: (id: string) => Promise<ActionResult>;
  onDelete: () => void;
  onClose: () => void;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <div className="border-portal-border flex flex-col gap-3 border-t p-4">
      <UnitTypeSelector selected={unitTypes} onChange={onUnitTypesChange} />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center justify-between">
        <div>
          {mode === "edit" && deleteAction && (
            <InlineConfirmDeleteBar
              idleLabel="Delete exercise"
              confirmLabel="Delete this exercise?"
              onDelete={onDelete}
              deleting={saving}
            />
          )}
        </div>
        <div className="flex gap-2">
          <PortalButton variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </PortalButton>
          <PortalButton variant="primary" onClick={onSave} disabled={saving}>
            {saving
              ? "Saving…"
              : mode === "create"
                ? "Create exercise"
                : "Save changes"}
          </PortalButton>
        </div>
      </div>
    </div>
  );
}

function ModalHeader({
  mode,
  onClose,
}: {
  mode: "create" | "edit";
  onClose: () => void;
}) {
  return (
    <div className="border-portal-border flex items-center justify-between border-b px-6 py-4">
      <h2 className="font-title text-portal-text1 text-lg font-extrabold tracking-wide">
        {mode === "create" ? "Create exercise" : "Edit exercise"}
      </h2>
      <button
        type="button"
        onClick={onClose}
        className="text-portal-text3 hover:bg-portal-bg hover:text-portal-text1 flex h-8 w-8 items-center justify-center rounded-lg">
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}
