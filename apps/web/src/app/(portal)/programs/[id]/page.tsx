import type { ExerciseFormData } from "@/src/components/portal/exercises/ExerciseModal";
import { ProgramCanvasShell } from "@/src/components/portal/programs/ProgramCanvasShell";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { getCoachProfile } from "@/src/services/auth.service";
import { listExercises } from "@/src/services/exercise.service";
import { listCategories } from "@/src/services/exerciseCategory.service";
import { getProgramById } from "@/src/services/program.service";
import { listSessionTemplates } from "@/src/services/sessionTemplate.service";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createBlockFromTemplateAction,
  createBlocksFromSessionTemplateAction,
  createSessionFromTemplateAction,
  saveBlockAsTemplateAction,
  saveSessionAsTemplateAction,
} from "../../blocks/actions";
import {
  createExerciseAction,
  updateExerciseAction,
  updateExerciseVideoUrlAction,
} from "../../exercises/actions";
import { updateProgramAction } from "../actions";
import {
  addExerciseToBlockAction,
  createBlockAction,
  createSessionAction,
  deleteBlockAction,
  deleteSessionAction,
  duplicateSessionAction,
  removeExerciseFromBlockAction,
  reorderBlockExercisesAction,
  reorderBlocksAction,
  setLinkedWeeksAction,
  updateBlockAction,
  updateBlockExerciseAction,
  updateSessionNameAction,
} from "./actions";

function BackToProgramsLink() {
  return (
    <Link
      href="/programs"
      className="text-portal-text2 text-xs font-semibold hover:underline">
      ← Back to programs
    </Link>
  );
}

export default async function ProgramCanvasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [
    programResult,
    exercisesResult,
    categoriesResult,
    profileResult,
    sessionTemplatesResult,
  ] = await Promise.all([
    getProgramById(id),
    listExercises(),
    listCategories(),
    getCoachProfile(),
    listSessionTemplates(),
  ]);

  if (!programResult.ok) notFound();

  const exercises = exercisesResult.ok ? exercisesResult.data : [];
  const categories = categoriesResult.ok ? categoriesResult.data : [];
  const profileId = profileResult.ok ? profileResult.data.id : "";
  const sessionTemplates = sessionTemplatesResult.ok
    ? sessionTemplatesResult.data
    : [];

  async function wrappedSaveBlockAsTemplate(blockId: string, name: string) {
    "use server";
    return saveBlockAsTemplateAction(blockId, name, profileId);
  }

  async function wrappedSaveSessionAsTemplate(sessionId: string, name: string) {
    "use server";
    return saveSessionAsTemplateAction(sessionId, name, profileId);
  }

  async function wrappedCreateExercise(data: ExerciseFormData) {
    "use server";
    return createExerciseAction({ ...data, created_by: profileId });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title={programResult.data.name}
        subtitle={`${programResult.data.weeks} weeks · ${programResult.data.sessions_per_week} sessions/week`}
        action={<BackToProgramsLink />}
      />
      <ProgramCanvasShell
        program={programResult.data}
        exercises={exercises}
        categories={categories}
        sessionTemplates={sessionTemplates}
        createSessionAction={createSessionAction}
        updateSessionNameAction={updateSessionNameAction}
        deleteSessionAction={deleteSessionAction}
        duplicateSessionAction={duplicateSessionAction}
        setLinkedWeeksAction={setLinkedWeeksAction}
        createBlockAction={createBlockAction}
        updateBlockAction={updateBlockAction}
        deleteBlockAction={deleteBlockAction}
        reorderBlocksAction={reorderBlocksAction}
        addExerciseToBlockAction={addExerciseToBlockAction}
        updateBlockExerciseAction={updateBlockExerciseAction}
        removeExerciseFromBlockAction={removeExerciseFromBlockAction}
        reorderBlockExercisesAction={reorderBlockExercisesAction}
        updateProgramAction={updateProgramAction}
        saveBlockAsTemplateAction={wrappedSaveBlockAsTemplate}
        saveSessionAsTemplateAction={wrappedSaveSessionAsTemplate}
        createBlockFromTemplateAction={createBlockFromTemplateAction}
        createBlocksFromSessionTemplateAction={
          createBlocksFromSessionTemplateAction
        }
        createSessionFromTemplateAction={createSessionFromTemplateAction}
        profileId={profileId}
        createExerciseAction={wrappedCreateExercise}
        updateExerciseAction={updateExerciseAction}
        updateExerciseVideoUrlAction={updateExerciseVideoUrlAction}
      />
    </div>
  );
}
