import type { ExerciseFormData } from "@/src/components/portal/exercises/ExerciseModal";
import { SessionViewShell } from "@/src/components/portal/programs/SessionViewShell";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { getCoachProfile } from "@/src/services/auth.service";
import type {
  AddExerciseToBlockInput,
  CreateBlockInput,
} from "@/src/services/block.service";
import { listExercises } from "@/src/services/exercise.service";
import { listCategories } from "@/src/services/exerciseCategory.service";
import {
  getSessionTemplateById,
  listSessionTemplates,
} from "@/src/services/sessionTemplate.service";
import type { SessionWithBlocks } from "@hooper/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createExerciseAction,
  updateExerciseAction,
  updateExerciseVideoUrlAction,
} from "../../exercises/actions";
import { createCategoryAction } from "../../exercises/categories/actions";
import {
  addExerciseToBlockTemplateAction,
  createBlockTemplateAction,
  createBlockTemplateFromTemplateAction,
  createBlockTemplatesFromSessionTemplateAction,
  deleteBlockTemplateAction,
  getLinkedWeeksForTemplateExerciseAction,
  removeExerciseFromBlockTemplateAction,
  reorderBlockTemplateExercisesAction,
  reorderBlockTemplatesAction,
  updateBlockTemplateAction,
  updateBlockTemplateExerciseAction,
} from "../actions";

async function createBlockAction(input: CreateBlockInput) {
  "use server";
  return createBlockTemplateAction({
    session_template_id: input.session_id,
    name: input.name,
  });
}

async function addExerciseToBlockAction(input: AddExerciseToBlockInput) {
  "use server";
  const { block_id, ...rest } = input;
  return addExerciseToBlockTemplateAction({
    block_template_id: block_id,
    ...rest,
  });
}

async function createBlockFromTemplateAction(input: {
  session_id: string;
  block_template_id: string;
}) {
  "use server";
  return createBlockTemplateFromTemplateAction({
    session_template_id: input.session_id,
    block_template_id: input.block_template_id,
  });
}

async function createBlocksFromSessionTemplateAction(input: {
  session_id: string;
  session_template_id: string;
}) {
  "use server";
  return createBlockTemplatesFromSessionTemplateAction({
    session_template_id: input.session_id,
    source_session_template_id: input.session_template_id,
  });
}

function BackToBlockLibraryLink() {
  return (
    <Link
      href="/blocks"
      className="text-portal-text2 text-xs font-semibold hover:underline">
      ← Back to Block Library
    </Link>
  );
}

async function loadBlockTemplatePageData(templateId: string) {
  const [
    templateResult,
    exercisesResult,
    categoriesResult,
    profileResult,
    sessionTemplatesResult,
  ] = await Promise.all([
    getSessionTemplateById(templateId),
    listExercises(),
    listCategories(),
    getCoachProfile(),
    listSessionTemplates(),
  ]);

  return {
    template: templateResult,
    exercises: exercisesResult.ok ? exercisesResult.data : [],
    categories: categoriesResult.ok ? categoriesResult.data : [],
    profileId: profileResult.ok ? profileResult.data.id : "",
    // Excludes itself — dragging a template into its own editor would nest a
    // copy of a template inside itself, which the Block Library has no
    // concept of undoing (there's no "remove a nested template" affordance,
    // just remove-block).
    sessionTemplates: sessionTemplatesResult.ok
      ? sessionTemplatesResult.data.filter((t) => t.id !== templateId)
      : [],
  };
}

export default async function BlockTemplateEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const {
    template: templateResult,
    exercises,
    categories,
    profileId,
    sessionTemplates,
  } = await loadBlockTemplatePageData(id);

  if (!templateResult.ok) notFound();

  const template = templateResult.data;

  async function wrappedCreateExercise(data: ExerciseFormData) {
    "use server";
    return createExerciseAction({ ...data, created_by: profileId });
  }

  // SessionViewShell/useSessionViewState only ever read `.id` and `.blocks`
  // off the session they're given — every other SessionWithBlocks field
  // below is unused padding to satisfy the type, since a template has no
  // program/week/position/link concept of its own (see templateShaping.ts).
  const sessionShape: SessionWithBlocks = {
    id: template.id,
    program_id: "",
    week_number: 1,
    name: template.name,
    position: 0,
    link_group_id: null,
    created_at: template.created_at,
    updated_at: template.updated_at,
    blocks: template.blocks,
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader
        title={template.name}
        subtitle="Block Library template"
        action={<BackToBlockLibraryLink />}
      />
      <SessionViewShell
        session={sessionShape}
        exercises={exercises}
        categories={categories}
        sessionTemplates={sessionTemplates}
        createBlockAction={createBlockAction}
        updateBlockAction={updateBlockTemplateAction}
        deleteBlockAction={deleteBlockTemplateAction}
        reorderBlocksAction={reorderBlockTemplatesAction}
        addExerciseToBlockAction={addExerciseToBlockAction}
        updateBlockExerciseAction={updateBlockTemplateExerciseAction}
        removeExerciseFromBlockAction={removeExerciseFromBlockTemplateAction}
        reorderBlockExercisesAction={reorderBlockTemplateExercisesAction}
        getLinkedWeeksForExerciseAction={
          getLinkedWeeksForTemplateExerciseAction
        }
        createBlockFromTemplateAction={createBlockFromTemplateAction}
        createBlocksFromSessionTemplateAction={
          createBlocksFromSessionTemplateAction
        }
        profileId={profileId}
        createExerciseAction={wrappedCreateExercise}
        updateExerciseAction={updateExerciseAction}
        updateExerciseVideoUrlAction={updateExerciseVideoUrlAction}
        createCategoryAction={createCategoryAction}
      />
    </div>
  );
}
