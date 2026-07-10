import type { SessionTemplateSummary } from "@hooper/db";

export type LibraryTemplate = {
  /** Full dnd drag id — "block-template:<id>" for a single-block template
   * (drops copy straight into a new block), "session-template:<id>" for a
   * multi-block one (drops copy every block in, in order). */
  dragId: string;
  name: string;
  exerciseCount: number;
  blockCount: number;
};

/** Every Block Library template, single- or multi-block, shaped for the
 * draggable library panel/shelf. A single-block template drags as that one
 * block; a multi-block template drags as its whole set, all landing
 * together wherever it's dropped (see useBlockExerciseDnd.ts). */
export function libraryTemplates(
  sessionTemplates: SessionTemplateSummary[],
  search: string,
): LibraryTemplate[] {
  const q = search.trim().toLowerCase();
  return sessionTemplates
    .filter((t) => t.blocks.length > 0)
    .map(
      (t): LibraryTemplate =>
        t.blocks.length === 1
          ? {
              dragId: `block-template:${t.blocks[0].id}`,
              name: t.blocks[0].name,
              exerciseCount: t.blocks[0].exerciseCount,
              blockCount: 1,
            }
          : {
              dragId: `session-template:${t.id}`,
              name: t.name,
              exerciseCount: t.blocks.reduce(
                (sum, b) => sum + b.exerciseCount,
                0,
              ),
              blockCount: t.blocks.length,
            },
    )
    .filter((b) => !q || b.name.toLowerCase().includes(q));
}
