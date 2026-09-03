import type { ExerciseFormData } from "@/src/components/portal/exercises/ExerciseModal";
import { SaveSessionAsTemplateButton } from "@/src/components/portal/programs/SaveSessionAsTemplateButton";
import { SessionNavArrows } from "@/src/components/portal/programs/SessionNavArrows";
import { SessionViewShell } from "@/src/components/portal/programs/SessionViewShell";
import { ShortcutsButton } from "@/src/components/portal/programs/ShortcutsButton";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { getCoachProfile } from "@/src/services/auth.service";
import { listExercises } from "@/src/services/exercise.service";
import { listCategories } from "@/src/services/exerciseCategory.service";
import { listStyles } from "@/src/services/exerciseStyle.service";
import { getProgramById } from "@/src/services/program.service";
import {
  getSessionById,
  listSessionsForProgram,
} from "@/src/services/session.service";
import { listSessionTemplates } from "@/src/services/sessionTemplate.service";
import { listUnitTypes } from "@/src/services/unitType.service";
import type { SessionRow } from "@hooper/db";
import { notFound } from "next/navigation";
import {
  createBlockFromTemplateAction,
  createBlocksFromSessionTemplateAction,
  saveBlockAsTemplateAction,
  saveSessionAsTemplateAction,
} from "../../../../blocks/actions";
import {
  createExerciseAction,
  updateExerciseAction,
  updateExerciseVideoUrlAction,
} from "../../../../exercises/actions";
import { createCategoryAction } from "../../../../exercises/categories/actions";
import { createStyleAction } from "../../../../exercises/styles/actions";
import { createUnitTypeAction } from "../../../../exercises/unit-types/actions";
import {
  addExerciseToBlockAction,
  createBlockAction,
  deleteBlockAction,
  getLinkedWeeksForExerciseAction,
  removeExerciseFromBlockAction,
  reorderBlockExercisesAction,
  reorderBlocksAction,
  updateBlockAction,
  updateBlockExerciseAction,
} from "../../actions";

function SessionPageActions({
  programId,
  sessionId,
  sessionName,
  programSessions,
  saveSessionAsTemplate,
}: {
  programId: string;
  sessionId: string;
  sessionName: string;
  programSessions: SessionRow[];
  saveSessionAsTemplate: (
    name: string,
  ) => Promise<{ ok: boolean; error?: string }>;
}) {
  return (
    <div className="flex items-center gap-2">
      <ShortcutsButton variant="session" />
      <SessionNavArrows
        programId={programId}
        sessions={programSessions}
        currentSessionId={sessionId}
      />
      <SaveSessionAsTemplateButton
        sessionName={sessionName}
        saveAction={saveSessionAsTemplate}
      />
    </div>
  );
}

async function loadSessionPageData(programId: string, sessionId: string) {
  const [
    sessionResult,
    exercisesResult,
    categoriesResult,
    stylesResult,
    unitTypesResult,
    profileResult,
    sessionTemplatesResult,
    programSessionsResult,
    programResult,
  ] = await Promise.all([
    getSessionById(sessionId),
    listExercises(),
    listCategories(),
    listStyles(),
    listUnitTypes(),
    getCoachProfile(),
    listSessionTemplates(),
    listSessionsForProgram(programId),
    getProgramById(programId),
  ]);

  return {
    session: sessionResult,
    exercises: exercisesResult.ok ? exercisesResult.data : [],
    categories: categoriesResult.ok ? categoriesResult.data : [],
    styles: stylesResult.ok ? stylesResult.data : [],
    unitTypes: unitTypesResult.ok ? unitTypesResult.data : [],
    profileId: profileResult.ok ? profileResult.data.id : "",
    sessionTemplates: sessionTemplatesResult.ok
      ? sessionTemplatesResult.data
      : [],
    programSessions: programSessionsResult.ok ? programSessionsResult.data : [],
    programName: programResult.ok ? programResult.data.name : "Program",
  };
}

export default async function SessionViewPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;
  const {
    session: sessionResult,
    exercises,
    categories,
    styles,
    unitTypes,
    profileId,
    sessionTemplates,
    programSessions,
    programName,
  } = await loadSessionPageData(id, sessionId);

  if (!sessionResult.ok) notFound();

  async function wrappedSaveBlockAsTemplate(blockId: string, name: string) {
    "use server";
    return saveBlockAsTemplateAction(blockId, name, profileId);
  }

  async function wrappedSaveSessionAsTemplate(name: string) {
    "use server";
    return saveSessionAsTemplateAction(sessionId, name, profileId);
  }

  async function wrappedCreateExercise(data: ExerciseFormData) {
    "use server";
    return createExerciseAction({ ...data, created_by: profileId });
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader
        title={sessionResult.data.name}
        subtitle={`Week ${sessionResult.data.week_number} · Session ${sessionResult.data.position + 1}`}
        backHref={`/programs/${id}`}
        breadcrumbs={[
          { label: "Programs", href: "/programs" },
          { label: programName, href: `/programs/${id}` },
          { label: sessionResult.data.name },
        ]}
        action={
          <SessionPageActions
            programId={id}
            sessionId={sessionId}
            sessionName={sessionResult.data.name}
            programSessions={programSessions}
            saveSessionAsTemplate={wrappedSaveSessionAsTemplate}
          />
        }
      />
      <SessionViewShell
        session={sessionResult.data}
        exercises={exercises}
        categories={categories}
        styles={styles}
        unitTypes={unitTypes}
        sessionTemplates={sessionTemplates}
        createBlockAction={createBlockAction}
        updateBlockAction={updateBlockAction}
        deleteBlockAction={deleteBlockAction}
        reorderBlocksAction={reorderBlocksAction}
        addExerciseToBlockAction={addExerciseToBlockAction}
        updateBlockExerciseAction={updateBlockExerciseAction}
        removeExerciseFromBlockAction={removeExerciseFromBlockAction}
        reorderBlockExercisesAction={reorderBlockExercisesAction}
        getLinkedWeeksForExerciseAction={getLinkedWeeksForExerciseAction}
        saveBlockAsTemplateAction={wrappedSaveBlockAsTemplate}
        createBlockFromTemplateAction={createBlockFromTemplateAction}
        createBlocksFromSessionTemplateAction={
          createBlocksFromSessionTemplateAction
        }
        profileId={profileId}
        createExerciseAction={wrappedCreateExercise}
        updateExerciseAction={updateExerciseAction}
        updateExerciseVideoUrlAction={updateExerciseVideoUrlAction}
        createCategoryAction={createCategoryAction}
        createStyleAction={createStyleAction}
        createUnitTypeAction={createUnitTypeAction}
      />
    </div>
  );
}
