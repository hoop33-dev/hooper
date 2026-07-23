import type { ExerciseFormData } from "@/src/components/portal/exercises/ExerciseModal";
import { ProgramCanvasShell } from "@/src/components/portal/programs/ProgramCanvasShell";
import { ProgramDetailActions } from "@/src/components/portal/programs/ProgramDetailActions";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { getCoachProfile } from "@/src/services/auth.service";
import { listExercises } from "@/src/services/exercise.service";
import { listCategories } from "@/src/services/exerciseCategory.service";
import { listForms } from "@/src/services/form.service";
import { getProgramById } from "@/src/services/program.service";
import { listSessionTemplates } from "@/src/services/sessionTemplate.service";
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
import {
  attachFormToProgramAction,
  deleteProgramAction,
  getImportSourceProgramAction,
  publishProgramAction,
  updateProgramAction,
} from "../actions";
import {
  addBlankProgramWeeksAction,
  addExerciseToBlockAction,
  copyProgramWeeksAction,
  createBlockAction,
  createSessionAction,
  deleteBlockAction,
  deleteProgramWeekAction,
  deleteSessionAction,
  duplicateSessionAction,
  listEligibleImportSourcesAction,
  removeExerciseFromBlockAction,
  reorderBlockExercisesAction,
  reorderBlocksAction,
  reorderSessionsAction,
  setLinkedWeeksAction,
  updateBlockAction,
  updateBlockExerciseAction,
  updateSessionNameAction,
} from "./actions";

function formatSessionsPerWeek(sessions: { week_number: number }[]): string {
  if (sessions.length === 0) return "no sessions yet";
  const counts = new Map<number, number>();
  for (const { week_number } of sessions) {
    counts.set(week_number, (counts.get(week_number) ?? 0) + 1);
  }
  const values = [...counts.values()];
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? `${min} sessions/week` : `${min}-${max} sessions/week`;
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
    formsResult,
  ] = await Promise.all([
    getProgramById(id),
    listExercises(),
    listCategories(),
    getCoachProfile(),
    listSessionTemplates(),
    listForms(),
  ]);

  if (!programResult.ok) notFound();

  const exercises = exercisesResult.ok ? exercisesResult.data : [];
  const categories = categoriesResult.ok ? categoriesResult.data : [];
  const profileId = profileResult.ok ? profileResult.data.id : "";
  const sessionTemplates = sessionTemplatesResult.ok
    ? sessionTemplatesResult.data
    : [];
  const forms = formsResult.ok ? formsResult.data : [];

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
        subtitle={`${programResult.data.weeks} weeks · ${formatSessionsPerWeek(programResult.data.sessions)}`}
        action={
          <ProgramDetailActions
            program={programResult.data}
            forms={forms}
            updateAction={updateProgramAction}
            deleteAction={deleteProgramAction}
            publishAction={publishProgramAction}
            attachFormAction={attachFormToProgramAction}
          />
        }
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
        reorderSessionsAction={reorderSessionsAction}
        createBlockAction={createBlockAction}
        updateBlockAction={updateBlockAction}
        deleteBlockAction={deleteBlockAction}
        reorderBlocksAction={reorderBlocksAction}
        addExerciseToBlockAction={addExerciseToBlockAction}
        updateBlockExerciseAction={updateBlockExerciseAction}
        removeExerciseFromBlockAction={removeExerciseFromBlockAction}
        reorderBlockExercisesAction={reorderBlockExercisesAction}
        updateProgramAction={updateProgramAction}
        deleteProgramWeekAction={deleteProgramWeekAction}
        addBlankProgramWeeksAction={addBlankProgramWeeksAction}
        listEligibleImportSourcesAction={listEligibleImportSourcesAction}
        getImportSourceProgramAction={getImportSourceProgramAction}
        copyProgramWeeksAction={copyProgramWeeksAction}
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
