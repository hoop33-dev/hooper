import type { ExerciseFormData } from "@/src/components/portal/exercises/ExerciseModal";
import { SaveSessionAsTemplateButton } from "@/src/components/portal/programs/SaveSessionAsTemplateButton";
import { SessionNavArrows } from "@/src/components/portal/programs/SessionNavArrows";
import { SessionViewShell } from "@/src/components/portal/programs/SessionViewShell";
import { ShortcutsButton } from "@/src/components/portal/programs/ShortcutsButton";
import { SessionEditorSkeleton } from "@/src/components/portal/ui/CanvasSkeleton";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { getCoachProfileId } from "@/src/services/auth.service";
import { listExercises } from "@/src/services/exercise.service";
import { listCategories } from "@/src/services/exerciseCategory.service";
import { listStyles } from "@/src/services/exerciseStyle.service";
import { getProgramHeader } from "@/src/services/program.service";
import {
  getSessionById,
  getSessionHeader,
  listSessionsForProgram,
} from "@/src/services/session.service";
import { listSessionTemplates } from "@/src/services/sessionTemplate.service";
import { listUnitTypes } from "@/src/services/unitType.service";
import type { SessionRow } from "@hooper/db";
import { notFound } from "next/navigation";
import { Suspense } from "react";
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

async function loadSessionShellData(sessionId: string) {
  const [
    sessionResult,
    exercisesResult,
    categoriesResult,
    stylesResult,
    unitTypesResult,
    sessionTemplatesResult,
  ] = await Promise.all([
    getSessionById(sessionId),
    listExercises(),
    listCategories(),
    listStyles(),
    listUnitTypes(),
    listSessionTemplates(),
  ]);

  return {
    session: sessionResult,
    exercises: exercisesResult.ok ? exercisesResult.data : [],
    categories: categoriesResult.ok ? categoriesResult.data : [],
    styles: stylesResult.ok ? stylesResult.data : [],
    unitTypes: unitTypesResult.ok ? unitTypesResult.data : [],
    sessionTemplates: sessionTemplatesResult.ok
      ? sessionTemplatesResult.data
      : [],
  };
}

export default async function SessionViewPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;

  // Critical path: the header + prev/next rail. The block tree streams in
  // behind <Suspense>.
  const [sessionHeader, programHeader, programSessionsResult, profileResult] =
    await Promise.all([
      getSessionHeader(sessionId),
      getProgramHeader(id),
      listSessionsForProgram(id),
      getCoachProfileId(),
    ]);

  if (!sessionHeader.ok) notFound();

  const session = sessionHeader.data;
  const programName = programHeader.ok ? programHeader.data.name : "Program";
  const programSessions = programSessionsResult.ok
    ? programSessionsResult.data
    : [];
  const profileId = profileResult.ok ? profileResult.data : "";

  async function wrappedSaveSessionAsTemplate(name: string) {
    "use server";
    return saveSessionAsTemplateAction(sessionId, name, profileId);
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader
        title={session.name}
        subtitle={`Week ${session.week_number} · Session ${session.position + 1}`}
        backHref={`/programs/${id}`}
        breadcrumbs={[
          { label: "Programs", href: "/programs" },
          { label: programName, href: `/programs/${id}` },
          { label: session.name },
        ]}
        action={
          <SessionPageActions
            programId={id}
            sessionId={sessionId}
            sessionName={session.name}
            programSessions={programSessions}
            saveSessionAsTemplate={wrappedSaveSessionAsTemplate}
          />
        }
      />
      <Suspense fallback={<SessionEditorSkeleton />}>
        <SessionCanvasData sessionId={sessionId} profileId={profileId} />
      </Suspense>
    </div>
  );
}

async function SessionCanvasData({
  sessionId,
  profileId,
}: {
  sessionId: string;
  profileId: string;
}) {
  const {
    session: sessionResult,
    exercises,
    categories,
    styles,
    unitTypes,
    sessionTemplates,
  } = await loadSessionShellData(sessionId);

  if (!sessionResult.ok) notFound();

  async function wrappedSaveBlockAsTemplate(blockId: string, name: string) {
    "use server";
    return saveBlockAsTemplateAction(blockId, name, profileId);
  }

  async function wrappedCreateExercise(data: ExerciseFormData) {
    "use server";
    return createExerciseAction({ ...data, created_by: profileId });
  }

  return (
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
  );
}
