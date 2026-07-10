"use client";

import type { ExerciseCategoryRow, ExerciseVideoSource } from "@hooper/db";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ExerciseModal,
  type ActionResult,
  type ExerciseFormData,
} from "../exercises/ExerciseModal";

interface CreateExerciseButtonProps {
  categories: ExerciseCategoryRow[];
  profileId: string;
  createExerciseAction: (data: ExerciseFormData) => Promise<ActionResult>;
  updateExerciseAction: (
    id: string,
    data: ExerciseFormData,
  ) => Promise<ActionResult>;
  updateExerciseVideoUrlAction: (
    id: string,
    videoUrl: string,
    videoSource: ExerciseVideoSource,
  ) => Promise<ActionResult>;
  className?: string;
}

/** Lets a coach create a new exercise without leaving the program/session
 * editor — opens the same modal as the Exercise Library page, then
 * refreshes so the new exercise appears in the picker right away. */
export function CreateExerciseButton({
  categories,
  profileId,
  createExerciseAction,
  updateExerciseAction,
  updateExerciseVideoUrlAction,
  className,
}: CreateExerciseButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleSaved() {
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "border-portal-border text-portal-text2 hover:bg-portal-bg hover:text-portal-text1 h-8 w-full flex-shrink-0 rounded-lg border border-dashed text-xs font-semibold"
        }>
        + Add new exercise
      </button>
      {open && (
        <ExerciseModal
          mode="create"
          categories={categories}
          profileId={profileId}
          onSave={handleSaved}
          onClose={() => setOpen(false)}
          createAction={createExerciseAction}
          updateAction={updateExerciseAction}
          updateVideoUrlAction={updateExerciseVideoUrlAction}
        />
      )}
    </>
  );
}
