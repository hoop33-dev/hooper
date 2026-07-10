"use client";

import type { ExerciseFormData } from "@/src/components/portal/exercises/ExerciseModal";
import { ExerciseModal } from "@/src/components/portal/exercises/ExerciseModal";
import { PortalButton } from "@/src/components/portal/ui/PortalButton";
import type {
  ExerciseCategoryRow,
  ExerciseVideoSource,
  ExerciseWithDetails,
} from "@hooper/db";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ActionResult = { ok: boolean; error?: string; id?: string };

interface ExerciseDetailActionsProps {
  exercise: ExerciseWithDetails;
  categories: ExerciseCategoryRow[];
  profileId: string;
  updateAction: (id: string, data: ExerciseFormData) => Promise<ActionResult>;
  deleteAction: (id: string) => Promise<ActionResult>;
  updateVideoUrlAction: (
    id: string,
    videoUrl: string,
    videoSource: ExerciseVideoSource,
  ) => Promise<ActionResult>;
}

export function ExerciseDetailActions({
  exercise,
  categories,
  profileId,
  updateAction,
  deleteAction,
  updateVideoUrlAction,
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
          updateVideoUrlAction={updateVideoUrlAction}
        />
      )}
    </>
  );
}
