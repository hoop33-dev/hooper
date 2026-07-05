import { SaveSessionAsTemplateButton } from "@/src/components/portal/programs/SaveSessionAsTemplateButton";
import { SessionNavArrows } from "@/src/components/portal/programs/SessionNavArrows";
import { SessionViewShell } from "@/src/components/portal/programs/SessionViewShell";
import { ArrowLeftIcon } from "@/src/components/portal/ui/icons";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { getCoachProfile } from "@/src/services/auth.service";
import { listExercises } from "@/src/services/exercise.service";
import { listCategories } from "@/src/services/exerciseCategory.service";
import {
  getSessionById,
  listSessionsForProgram,
} from "@/src/services/session.service";
import { listSessionTemplates } from "@/src/services/sessionTemplate.service";
import type { SessionRow } from "@hooper/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createBlockFromTemplateAction,
  saveBlockAsTemplateAction,
  saveSessionAsTemplateAction,
} from "../../../../blocks/actions";
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
    <div className="flex flex-col items-end gap-1.5">
      <Link
        href={`/programs/${programId}`}
        className="text-portal-text2 flex items-center gap-1 text-xs font-semibold hover:underline">
        <ArrowLeftIcon size={11} />
        Back to program
      </Link>
      <div className="mt-2 flex items-center gap-2">
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
    </div>
  );
}

export default async function SessionViewPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;
  const [
    sessionResult,
    exercisesResult,
    categoriesResult,
    profileResult,
    sessionTemplatesResult,
    programSessionsResult,
  ] = await Promise.all([
    getSessionById(sessionId),
    listExercises(),
    listCategories(),
    getCoachProfile(),
    listSessionTemplates(),
    listSessionsForProgram(id),
  ]);

  if (!sessionResult.ok) notFound();

  const exercises = exercisesResult.ok ? exercisesResult.data : [];
  const categories = categoriesResult.ok ? categoriesResult.data : [];
  const profileId = profileResult.ok ? profileResult.data.id : "";
  const sessionTemplates = sessionTemplatesResult.ok
    ? sessionTemplatesResult.data
    : [];
  const programSessions = programSessionsResult.ok
    ? programSessionsResult.data
    : [];

  async function wrappedSaveBlockAsTemplate(blockId: string, name: string) {
    "use server";
    return saveBlockAsTemplateAction(blockId, name, profileId);
  }

  async function wrappedSaveSessionAsTemplate(name: string) {
    "use server";
    return saveSessionAsTemplateAction(sessionId, name, profileId);
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader
        title={sessionResult.data.name}
        subtitle={`Week ${sessionResult.data.week_number} · Session ${sessionResult.data.position + 1}`}
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
      />
    </div>
  );
}
