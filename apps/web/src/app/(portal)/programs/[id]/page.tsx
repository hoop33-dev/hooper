import { ProgramCanvasShell } from "@/src/components/portal/programs/ProgramCanvasShell";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { listExercises } from "@/src/services/exercise.service";
import { listCategories } from "@/src/services/exerciseCategory.service";
import { getProgramById } from "@/src/services/program.service";
import { notFound } from "next/navigation";
import {
  addExerciseToBlockAction,
  createBlockAction,
  createSessionAction,
  deleteBlockAction,
  deleteSessionAction,
  duplicateSessionAction,
  removeExerciseFromBlockAction,
  reorderBlockExercisesAction,
  updateBlockAction,
  updateBlockExerciseAction,
  updateSessionNameAction,
} from "./actions";

export default async function ProgramCanvasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [programResult, exercisesResult, categoriesResult] = await Promise.all([
    getProgramById(id),
    listExercises(),
    listCategories(),
  ]);

  if (!programResult.ok) notFound();

  const exercises = exercisesResult.ok ? exercisesResult.data : [];
  const categories = categoriesResult.ok ? categoriesResult.data : [];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title={programResult.data.name}
        subtitle={`${programResult.data.weeks} weeks · ${programResult.data.sessions_per_week} sessions/week`}
      />
      <ProgramCanvasShell
        program={programResult.data}
        exercises={exercises}
        categories={categories}
        createSessionAction={createSessionAction}
        updateSessionNameAction={updateSessionNameAction}
        deleteSessionAction={deleteSessionAction}
        duplicateSessionAction={duplicateSessionAction}
        createBlockAction={createBlockAction}
        updateBlockAction={updateBlockAction}
        deleteBlockAction={deleteBlockAction}
        addExerciseToBlockAction={addExerciseToBlockAction}
        updateBlockExerciseAction={updateBlockExerciseAction}
        removeExerciseFromBlockAction={removeExerciseFromBlockAction}
        reorderBlockExercisesAction={reorderBlockExercisesAction}
      />
    </div>
  );
}
