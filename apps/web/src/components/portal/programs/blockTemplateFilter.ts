import type { SessionTemplateSummary } from "@hooper/db";

export type SingleBlockTemplate = {
  blockTemplateId: string;
  name: string;
  exerciseCount: number;
};

/** Only templates with exactly one block can be dragged straight into a
 * session as a new block — a multi-block template is a whole reusable
 * session instead (see "+ Add session > From template"). */
export function singleBlockTemplates(
  sessionTemplates: SessionTemplateSummary[],
  search: string,
): SingleBlockTemplate[] {
  const q = search.trim().toLowerCase();
  return sessionTemplates
    .filter((t) => t.blocks.length === 1)
    .map((t) => ({
      blockTemplateId: t.blocks[0].id,
      name: t.blocks[0].name,
      exerciseCount: t.blocks[0].exerciseCount,
    }))
    .filter((b) => !q || b.name.toLowerCase().includes(q));
}
