"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ExerciseCategoryRow, ExerciseWithDetails } from "@hooper/db";
import { ExerciseModal } from "@/src/components/portal/exercises/ExerciseModal";
import { PortalButton } from "@/src/components/portal/ui/PortalButton";
import type { ExerciseFormData } from "@/src/components/portal/exercises/ExerciseModal";

interface ExerciseDetailActionsProps {
  exercise: ExerciseWithDetails;
  categories: ExerciseCategoryRow[];
  profileId: string;
  updateAction: (id: string, data: ExerciseFormData) => Promise<{ ok: boolean; error?: string }>;
  deleteAction: (id: string) => Promise<{ ok: boolean; error?: string }>;
  uploadVideoAction: (exerciseId: string, file: File, profileId: string) => Promise<{ ok: boolean; error?: string }>;
}

export function ExerciseDetailActions({
  exercise,
  categories,
  profileId,
  updateAction,
  deleteAction,
  uploadVideoAction,
}: ExerciseDetailActionsProps) {
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  function handleSaved() {
    setEditing(false);
    router.refresh();
  }

  function handleDeleted() {
    router.push("/exercises");
  }

  return (
    <>
      <PortalButton variant="secondary" onClick={() => setEditing(true)}>
        Edit exercise
      </PortalButton>
      {editing && (
        <ExerciseModal
          mode="edit"
          exercise={exercise}
          categories={categories}
          profileId={profileId}
          onSave={handleSaved}
          onClose={() => setEditing(false)}
          onDelete={handleDeleted}
          createAction={async () => ({ ok: false, error: "Not applicable" })}
          updateAction={updateAction}
          deleteAction={deleteAction}
          uploadVideoAction={uploadVideoAction}
        />
      )}
    </>
  );
}
