"use client";

import type { ExerciseCategoryRow, ExerciseVideoSource } from "@hooper/db";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
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
  createCategoryAction?: (input: {
    name: string;
    created_by: string;
  }) => Promise<{ ok: boolean; data?: ExerciseCategoryRow; error?: string }>;
  className?: string;
  /** Fires whenever the post-save refresh starts/finishes, so the list this
   * button lives in can show a loading state until the new exercise
   * actually appears rather than going silent between "Saving…" and the
   * row showing up. */
  onPendingChange?: (pending: boolean) => void;
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
  createCategoryAction,
  className,
  onPendingChange,
}: CreateExerciseButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  function handleSaved() {
    setOpen(false);
    startTransition(() => {
      router.refresh();
    });
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
          createCategoryAction={createCategoryAction}
        />
      )}
    </>
  );
}
