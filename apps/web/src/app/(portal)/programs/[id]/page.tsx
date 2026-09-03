import type { ExerciseFormData } from "@/src/components/portal/exercises/ExerciseModal";
import { ProgramCanvasHeader } from "@/src/components/portal/programs/ProgramCanvasHeader";
import { ProgramCanvasShell } from "@/src/components/portal/programs/ProgramCanvasShell";
import { ProgramDetailActions } from "@/src/components/portal/programs/ProgramDetailActions";
import { ProgramHeaderCollapseProvider } from "@/src/components/portal/programs/ProgramHeaderCollapseContext";
import { ShortcutsButton } from "@/src/components/portal/programs/ShortcutsButton";
import { getCoachProfile } from "@/src/services/auth.service";
import { listExercises } from "@/src/services/exercise.service";
import { listCategories } from "@/src/services/exerciseCategory.service";
import { listStyles } from "@/src/services/exerciseStyle.service";
import { listForms } from "@/src/services/form.service";
import { getProgramById } from "@/src/services/program.service";
import { listSessionTemplates } from "@/src/services/sessionTemplate.service";
import { listUnitTypes } from "@/src/services/unitType.service";
import type { FormSummary, ProgramWithSessions } from "@hooper/db";
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
import { createCategoryAction } from "../../exercises/categories/actions";
import { createStyleAction } from "../../exercises/styles/actions";
import { createUnitTypeAction } from "../../exercises/unit-types/actions";
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
  duplicateProgramWeeksAction,
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

async function loadProgramCanvasPageData(id: string) {
  const [
    programResult,
    exercisesResult,
    categoriesResult,
    stylesResult,
    unitTypesResult,
    profileResult,
    sessionTemplatesResult,
    formsResult,
  ] = await Promise.all([
    getProgramById(id),
    listExercises(),
    listCategories(),
    listStyles(),
    listUnitTypes(),
    getCoachProfile(),
    listSessionTemplates(),
    listForms(),
  ]);

  return {
    program: programResult,
    exercises: exercisesResult.ok ? exercisesResult.data : [],
    categories: categoriesResult.ok ? categoriesResult.data : [],
    styles: stylesResult.ok ? stylesResult.data : [],
    unitTypes: unitTypesResult.ok ? unitTypesResult.data : [],
    profileId: profileResult.ok ? profileResult.data.id : "",
    coachName: profileResult.ok
      ? [profileResult.data.first_name, profileResult.data.last_name]
          .filter(Boolean)
          .join(" ")
      : "",
    sessionTemplates: sessionTemplatesResult.ok
      ? sessionTemplatesResult.data
      : [],
    forms: formsResult.ok ? formsResult.data : [],
  };
}

function ProgramCanvasPageHeader({
  program,
  forms,
  coachName,
}: {
  program: ProgramWithSessions;
  forms: FormSummary[];
  coachName: string;
}) {
  return (
    <ProgramCanvasHeader
      title={program.name}
      backHref="/programs"
      breadcrumbs={[
        { label: "Programs", href: "/programs" },
        { label: program.name },
      ]}
      action={
        <ProgramDetailActions
          program={program}
          coachName={coachName}
          forms={forms}
          updateAction={updateProgramAction}
          deleteAction={deleteProgramAction}
          publishAction={publishProgramAction}
          attachFormAction={attachFormToProgramAction}
          shortcutsButton={
            <ShortcutsButton key="shortcuts" variant="program" />
          }
        />
      }
    />
  );
}

export default async function ProgramCanvasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const {
    program: programResult,
    exercises,
    categories,
    styles,
    unitTypes,
    profileId,
    coachName,
    sessionTemplates,
    forms,
  } = await loadProgramCanvasPageData(id);

  if (!programResult.ok) notFound();

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
    <ProgramHeaderCollapseProvider>
      <div className="flex h-full flex-col overflow-hidden">
        <ProgramCanvasPageHeader
          program={programResult.data}
          forms={forms}
          coachName={coachName}
        />
        <ProgramCanvasShell
          program={programResult.data}
          exercises={exercises}
          categories={categories}
          styles={styles}
          unitTypes={unitTypes}
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
          duplicateProgramWeeksAction={duplicateProgramWeeksAction}
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
          createCategoryAction={createCategoryAction}
          createStyleAction={createStyleAction}
          createUnitTypeAction={createUnitTypeAction}
        />
      </div>
    </ProgramHeaderCollapseProvider>
  );
}
