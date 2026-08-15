"use client";

import type {
  ExerciseCategoryRow,
  ExerciseStyleRow,
  ExerciseVideoSource,
  ExerciseWithDetails,
  UnitTypeRow,
} from "@hooper/db";
import type { MouseEvent } from "react";
import { InlineConfirmBar } from "../ui/InlineConfirmBar";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput, PortalTextarea } from "../ui/PortalInput";
import { useModalDismiss } from "../ui/useModalDismiss";
import { CategoryCombobox } from "./CategoryCombobox";
import { ParentExerciseSelect } from "./ParentExerciseSelect";
import { StyleSelect } from "./StyleSelect";
import { UnitTypeSelect } from "./UnitTypeSelect";
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
  const {
    mode,
    exercise,
    categories,
    baseExercises,
    onClose,
    deleteAction,
    createCategoryAction,
    createStyleAction,
    createUnitTypeAction,
    profileId,
  } = props;
  const form = useExerciseModalForm(props);
  const onBackdropClick = useModalDismiss(onClose);
  const hasVariants = !!exercise && exercise.variants.length > 0;

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
      createCategoryAction={createCategoryAction}
      profileId={profileId}
      videoUrl={exercise?.video_url}
      videoSource={exercise?.video_source}
      onVideoChange={form.setVideoState}
      baseExercises={baseExercises}
      parentId={form.parentId}
      onParentChange={form.setParentId}
      hasVariants={hasVariants}
      lockedParentId={props.lockedParentId}
      styles={form.styles}
      defaultStyleId={form.defaultStyleId}
      onDefaultStyleChange={form.setDefaultStyleId}
      onStyleCreated={form.addStyle}
      createStyleAction={createStyleAction}
      unitTypes={form.unitTypes}
      unitTypeIds={form.unitTypeIds}
      onUnitTypeIdsChange={form.setUnitTypeIds}
      onUnitTypeCreated={form.addUnitType}
      createUnitTypeAction={createUnitTypeAction}
      error={form.error}
      deleteAction={deleteAction}
      onDelete={form.handleDelete}
      saving={form.saving}
      onSave={form.handleSave}
    />
  );
}

type ModalLayoutProps = {
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
  createCategoryAction?: ExerciseModalProps["createCategoryAction"];
  profileId: string;
  videoUrl?: string | null;
  videoSource?: ExerciseVideoSource | null;
  onVideoChange: (value: VideoFieldState) => void;
  baseExercises: ExerciseWithDetails[];
  parentId: string;
  onParentChange: (id: string) => void;
  hasVariants: boolean;
  lockedParentId?: string;
  styles: ExerciseStyleRow[];
  defaultStyleId: string;
  onDefaultStyleChange: (id: string) => void;
  onStyleCreated: (style: ExerciseStyleRow) => void;
  createStyleAction?: ExerciseModalProps["createStyleAction"];
  unitTypes: UnitTypeRow[];
  unitTypeIds: string[];
  onUnitTypeIdsChange: (ids: string[]) => void;
  onUnitTypeCreated: (unitType: UnitTypeRow) => void;
  createUnitTypeAction?: ExerciseModalProps["createUnitTypeAction"];
  error: string | null;
  deleteAction?: (id: string) => Promise<ActionResult>;
  onDelete: () => void;
  saving: boolean;
  onSave: () => void;
};

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
  createCategoryAction,
  profileId,
  videoUrl,
  videoSource,
  onVideoChange,
  baseExercises,
  parentId,
  onParentChange,
  hasVariants,
  lockedParentId,
  styles,
  defaultStyleId,
  onDefaultStyleChange,
  onStyleCreated,
  createStyleAction,
  unitTypes,
  unitTypeIds,
  onUnitTypeIdsChange,
  onUnitTypeCreated,
  createUnitTypeAction,
  error,
  deleteAction,
  onDelete,
  saving,
  onSave,
}: ModalLayoutProps) {
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
          createCategoryAction={createCategoryAction}
          profileId={profileId}
          videoUrl={videoUrl}
          videoSource={videoSource}
          onVideoChange={onVideoChange}
          baseExercises={baseExercises}
          parentId={parentId}
          onParentChange={onParentChange}
          hasVariants={hasVariants}
          lockedParentId={lockedParentId}
          styles={styles}
          defaultStyleId={defaultStyleId}
          onDefaultStyleChange={onDefaultStyleChange}
          onStyleCreated={onStyleCreated}
          createStyleAction={createStyleAction}
          unitTypes={unitTypes}
          unitTypeIds={unitTypeIds}
          onUnitTypeIdsChange={onUnitTypeIdsChange}
          onUnitTypeCreated={onUnitTypeCreated}
          createUnitTypeAction={createUnitTypeAction}
        />
        <ModalFooter
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

function ExerciseTaxonomyFields({
  profileId,
  styles,
  defaultStyleId,
  onDefaultStyleChange,
  onStyleCreated,
  createStyleAction,
  unitTypes,
  unitTypeIds,
  onUnitTypeIdsChange,
  onUnitTypeCreated,
  createUnitTypeAction,
}: {
  profileId: string;
  styles: ExerciseStyleRow[];
  defaultStyleId: string;
  onDefaultStyleChange: (id: string) => void;
  onStyleCreated: (style: ExerciseStyleRow) => void;
  createStyleAction?: ExerciseModalProps["createStyleAction"];
  unitTypes: UnitTypeRow[];
  unitTypeIds: string[];
  onUnitTypeIdsChange: (ids: string[]) => void;
  onUnitTypeCreated: (unitType: UnitTypeRow) => void;
  createUnitTypeAction?: ExerciseModalProps["createUnitTypeAction"];
}) {
  return (
    <>
      <StyleSelect
        styles={styles}
        value={defaultStyleId}
        onChange={onDefaultStyleChange}
        createStyleAction={createStyleAction}
        profileId={profileId}
        onStyleCreated={onStyleCreated}
      />
      <UnitTypeSelect
        unitTypes={unitTypes}
        selected={unitTypeIds}
        onChange={onUnitTypeIdsChange}
        createUnitTypeAction={createUnitTypeAction}
        profileId={profileId}
        onUnitTypeCreated={onUnitTypeCreated}
      />
    </>
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
  createCategoryAction,
  profileId,
  videoUrl,
  videoSource,
  onVideoChange,
  baseExercises,
  parentId,
  onParentChange,
  hasVariants,
  lockedParentId,
  styles,
  defaultStyleId,
  onDefaultStyleChange,
  onStyleCreated,
  createStyleAction,
  unitTypes,
  unitTypeIds,
  onUnitTypeIdsChange,
  onUnitTypeCreated,
  createUnitTypeAction,
}: {
  name: string;
  description: string;
  nameError?: string;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  categories: ExerciseCategoryRow[];
  categoryIds: string[];
  onCategoryChange: (ids: string[]) => void;
  createCategoryAction?: ExerciseModalProps["createCategoryAction"];
  profileId: string;
  videoUrl?: string | null;
  videoSource?: ExerciseVideoSource | null;
  onVideoChange: (value: VideoFieldState) => void;
  baseExercises: ExerciseWithDetails[];
  parentId: string;
  onParentChange: (id: string) => void;
  hasVariants: boolean;
  lockedParentId?: string;
  styles: ExerciseStyleRow[];
  defaultStyleId: string;
  onDefaultStyleChange: (id: string) => void;
  onStyleCreated: (style: ExerciseStyleRow) => void;
  createStyleAction?: ExerciseModalProps["createStyleAction"];
  unitTypes: UnitTypeRow[];
  unitTypeIds: string[];
  onUnitTypeIdsChange: (ids: string[]) => void;
  onUnitTypeCreated: (unitType: UnitTypeRow) => void;
  createUnitTypeAction?: ExerciseModalProps["createUnitTypeAction"];
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
          createCategoryAction={createCategoryAction}
          profileId={profileId}
        />
        <ParentExerciseSelect
          baseExercises={baseExercises}
          value={lockedParentId ?? parentId}
          onChange={onParentChange}
          disabled={hasVariants}
          locked={!!lockedParentId}
        />
        <ExerciseTaxonomyFields
          profileId={profileId}
          styles={styles}
          defaultStyleId={defaultStyleId}
          onDefaultStyleChange={onDefaultStyleChange}
          onStyleCreated={onStyleCreated}
          createStyleAction={createStyleAction}
          unitTypes={unitTypes}
          unitTypeIds={unitTypeIds}
          onUnitTypeIdsChange={onUnitTypeIdsChange}
          onUnitTypeCreated={onUnitTypeCreated}
          createUnitTypeAction={createUnitTypeAction}
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
  error,
  mode,
  deleteAction,
  onDelete,
  onClose,
  saving,
  onSave,
}: {
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
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center justify-between">
        <div>
          {mode === "edit" && deleteAction && (
            <InlineConfirmBar
              idleLabel="Delete exercise"
              confirmLabel="Delete this exercise?"
              onConfirm={onDelete}
              loading={saving}
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
