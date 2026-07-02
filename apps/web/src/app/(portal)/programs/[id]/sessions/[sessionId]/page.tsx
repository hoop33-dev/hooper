import { SessionViewShell } from "@/src/components/portal/programs/SessionViewShell";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { listExercises } from "@/src/services/exercise.service";
import { listCategories } from "@/src/services/exerciseCategory.service";
import { getSessionById } from "@/src/services/session.service";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addExerciseToBlockAction,
  createBlockAction,
  deleteBlockAction,
  removeExerciseFromBlockAction,
  reorderBlockExercisesAction,
  reorderBlocksAction,
  updateBlockAction,
  updateBlockExerciseAction,
} from "../../actions";

export default async function SessionViewPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;
  const [sessionResult, exercisesResult, categoriesResult] = await Promise.all([
    getSessionById(sessionId),
    listExercises(),
    listCategories(),
  ]);

  if (!sessionResult.ok) notFound();

  const exercises = exercisesResult.ok ? exercisesResult.data : [];
  const categories = categoriesResult.ok ? categoriesResult.data : [];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader
        title={sessionResult.data.name}
        subtitle={`Week ${sessionResult.data.week_number} · Session ${sessionResult.data.position + 1}`}
        action={
          <Link
            href={`/programs/${id}`}
            className="text-portal-text2 text-xs font-semibold hover:underline">
            ← Back to program
          </Link>
        }
      />
      <SessionViewShell
        session={sessionResult.data}
        exercises={exercises}
        categories={categories}
        createBlockAction={createBlockAction}
        updateBlockAction={updateBlockAction}
        deleteBlockAction={deleteBlockAction}
        reorderBlocksAction={reorderBlocksAction}
        addExerciseToBlockAction={addExerciseToBlockAction}
        updateBlockExerciseAction={updateBlockExerciseAction}
        removeExerciseFromBlockAction={removeExerciseFromBlockAction}
        reorderBlockExercisesAction={reorderBlockExercisesAction}
      />
    </div>
  );
}
