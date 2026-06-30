import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { ExerciseLibraryShell } from "@/src/components/portal/exercises/ExerciseLibraryShell";
import { listExercises } from "@/src/services/exercise.service";
import { listCategories } from "@/src/services/exerciseCategory.service";
import { getCoachProfile } from "@/src/services/auth.service";
import {
  createExerciseAction,
  updateExerciseAction,
  deleteExerciseAction,
} from "./actions";
import { uploadExerciseVideo } from "@/src/services/exercise.service";
import type { ExerciseFormData } from "@/src/components/portal/exercises/ExerciseModal";

export default async function ExercisesPage() {
  const [exercisesResult, categoriesResult, profileResult] = await Promise.all([
    listExercises(),
    listCategories(),
    getCoachProfile(),
  ]);

  const exercises = exercisesResult.ok ? exercisesResult.data : [];
  const categories = categoriesResult.ok ? categoriesResult.data : [];
  const profileId = profileResult.ok ? profileResult.data.id : "";

  async function uploadVideoAction(exerciseId: string, file: File, pid: string) {
    "use server";
    const result = await uploadExerciseVideo(exerciseId, file, pid);
    return result.ok ? { ok: true } : { ok: false, error: result.error };
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
        profileId={profileId}
        searchQuery=""
        selectedCategoryId=""
        createAction={wrappedCreate}
        updateAction={updateExerciseAction}
        deleteAction={deleteExerciseAction}
        uploadVideoAction={uploadVideoAction}
      />
    </div>
  );
}
