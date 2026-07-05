import { SessionViewShell } from "@/src/components/portal/programs/SessionViewShell";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import type {
  AddExerciseToBlockInput,
  CreateBlockInput,
} from "@/src/services/block.service";
import { listExercises } from "@/src/services/exercise.service";
import { listCategories } from "@/src/services/exerciseCategory.service";
import { getSessionTemplateById } from "@/src/services/sessionTemplate.service";
import type { SessionWithBlocks } from "@hooper/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addExerciseToBlockTemplateAction,
  createBlockTemplateAction,
  deleteBlockTemplateAction,
  getLinkedWeeksForTemplateExerciseAction,
  removeExerciseFromBlockTemplateAction,
  reorderBlockTemplateExercisesAction,
  reorderBlockTemplatesAction,
  updateBlockTemplateAction,
  updateBlockTemplateExerciseAction,
} from "../actions";

export default async function BlockTemplateEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [templateResult, exercisesResult, categoriesResult] = await Promise.all(
    [getSessionTemplateById(id), listExercises(), listCategories()],
  );

  if (!templateResult.ok) notFound();

  const template = templateResult.data;
  const exercises = exercisesResult.ok ? exercisesResult.data : [];
  const categories = categoriesResult.ok ? categoriesResult.data : [];

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

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader
        title={template.name}
        subtitle="Block Library template"
        action={
          <Link
            href="/blocks"
            className="text-portal-text2 text-xs font-semibold hover:underline">
            ← Back to Block Library
          </Link>
        }
      />
      <SessionViewShell
        session={sessionShape}
        exercises={exercises}
        categories={categories}
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
      />
    </div>
  );
}
