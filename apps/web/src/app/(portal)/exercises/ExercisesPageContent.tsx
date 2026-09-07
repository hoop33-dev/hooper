import { ExerciseLibraryShell } from "@/src/components/portal/exercises/ExerciseLibraryShell";
import { ExerciseLibrarySkeleton } from "@/src/components/portal/exercises/ExerciseLibrarySkeleton";
import type { ExerciseFormData } from "@/src/components/portal/exercises/ExerciseModal";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { getCoachProfileId } from "@/src/services/auth.service";
import { listExercises } from "@/src/services/exercise.service";
import { listCategories } from "@/src/services/exerciseCategory.service";
import { listStyles } from "@/src/services/exerciseStyle.service";
import { listUnitTypes } from "@/src/services/unitType.service";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  createExerciseAction,
  deleteExerciseAction,
  updateExerciseAction,
  updateExerciseVideoUrlAction,
} from "./actions";
import { createCategoryAction } from "./categories/actions";
import { createStyleAction } from "./styles/actions";
import { createUnitTypeAction } from "./unit-types/actions";

/** Shared by /exercises and /exercises/[id] — the latter renders the same
 * library with the edit modal for that exercise pre-opened, so the URL
 * stays in sync with whichever exercise's modal is open. */
export function ExercisesPageContent({
  editExerciseId,
}: {
  editExerciseId?: string;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Exercise Library"
        subtitle="Create and manage exercises for your training programs"
      />
      <Suspense fallback={<ExerciseLibrarySkeleton />}>
        <ExerciseLibraryData editExerciseId={editExerciseId} />
      </Suspense>
    </div>
  );
}

async function ExerciseLibraryData({
  editExerciseId,
}: {
  editExerciseId?: string;
}) {
  const [
    exercisesResult,
    categoriesResult,
    stylesResult,
    unitTypesResult,
    profileResult,
  ] = await Promise.all([
    listExercises(),
    listCategories(),
    listStyles(),
    listUnitTypes(),
    getCoachProfileId(),
  ]);

  const exercises = exercisesResult.ok ? exercisesResult.data : [];
  const categories = categoriesResult.ok ? categoriesResult.data : [];
  const styles = stylesResult.ok ? stylesResult.data : [];
  const unitTypes = unitTypesResult.ok ? unitTypesResult.data : [];
  const profileId = profileResult.ok ? profileResult.data : "";

  if (editExerciseId && !exercises.some((ex) => ex.id === editExerciseId)) {
    notFound();
  }

  async function wrappedCreate(data: ExerciseFormData) {
    "use server";
    return createExerciseAction({ ...data, created_by: profileId });
  }

  return (
    <ExerciseLibraryShell
      exercises={exercises}
      categories={categories}
      styles={styles}
      unitTypes={unitTypes}
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
      createUnitTypeAction={createUnitTypeAction}
    />
  );
}
