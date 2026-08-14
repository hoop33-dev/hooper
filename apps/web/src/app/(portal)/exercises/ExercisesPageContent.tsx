import { ExerciseLibraryShell } from "@/src/components/portal/exercises/ExerciseLibraryShell";
import type { ExerciseFormData } from "@/src/components/portal/exercises/ExerciseModal";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { getCoachProfile } from "@/src/services/auth.service";
import { listExercises } from "@/src/services/exercise.service";
import { listCategories } from "@/src/services/exerciseCategory.service";
import { listStyles } from "@/src/services/exerciseStyle.service";
import { notFound } from "next/navigation";
import {
  createExerciseAction,
  deleteExerciseAction,
  updateExerciseAction,
  updateExerciseVideoUrlAction,
} from "./actions";
import { createCategoryAction } from "./categories/actions";
import { createStyleAction } from "./styles/actions";

/** Shared by /exercises and /exercises/[id] — the latter renders the same
 * library with the edit modal for that exercise pre-opened, so the URL
 * stays in sync with whichever exercise's modal is open. */
export async function ExercisesPageContent({
  editExerciseId,
}: {
  editExerciseId?: string;
}) {
  const [exercisesResult, categoriesResult, stylesResult, profileResult] =
    await Promise.all([
      listExercises(),
      listCategories(),
      listStyles(),
      getCoachProfile(),
    ]);

  const exercises = exercisesResult.ok ? exercisesResult.data : [];
  const categories = categoriesResult.ok ? categoriesResult.data : [];
  const styles = stylesResult.ok ? stylesResult.data : [];
  const profileId = profileResult.ok ? profileResult.data.id : "";

  if (editExerciseId && !exercises.some((ex) => ex.id === editExerciseId)) {
    notFound();
  }

  async function wrappedCreate(data: ExerciseFormData) {
    "use server";
    return createExerciseAction({ ...data, created_by: profileId });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Exercise Library"
        subtitle="Create and manage exercises for your training programs"
      />
      <ExerciseLibraryShell
        exercises={exercises}
        categories={categories}
        styles={styles}
        profileId={profileId}
        searchQuery=""
        selectedCategoryId=""
        initialEditExerciseId={editExerciseId}
        createAction={wrappedCreate}
        updateAction={updateExerciseAction}
        deleteAction={deleteExerciseAction}
        updateVideoUrlAction={updateExerciseVideoUrlAction}
        createCategoryAction={createCategoryAction}
        createStyleAction={createStyleAction}
      />
    </div>
  );
}
