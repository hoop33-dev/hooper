import { cn } from "@/src/lib/cn";
import type {
  BlockWithExercises,
  ExerciseWithDetails,
  SessionTemplateSummary,
} from "@hooper/db";

interface DragPreviewOverlayProps {
  activeId: string | null;
  blocks: BlockWithExercises[];
  exercisesById: Map<string, ExerciseWithDetails>;
  blockTemplateNamesById?: Map<string, string>;
  sessionTemplatesById?: Map<string, SessionTemplateSummary>;
}

type GhostContent = { label: string; accentColor?: string };

function GhostCard({ label, accentColor }: GhostContent) {
  return (
    <div className="border-portal-border bg-portal-card shadow-ambient cursor-grabbing rounded-lg border px-3 py-2 opacity-90">
      <span
        className={cn(
          "text-[13px] font-semibold",
          !accentColor && "text-portal-text1",
        )}
        style={accentColor ? { color: accentColor } : undefined}>
        {label}
      </span>
    </div>
  );
}

function findBlockExercise(
  blocks: BlockWithExercises[],
  exerciseRowId: string,
) {
  for (const block of blocks) {
    const match = block.exercises.find((e) => e.id === exerciseRowId);
    if (match) return match;
  }
  return undefined;
}

/** Resolves what the drag overlay should show for a given active drag id —
 * one lookup per drag source type, dispatched below rather than branched
 * inline so the component itself stays a single flat render. */
function resolveGhostContent(
  type: string,
  value: string,
  {
    blocks,
    exercisesById,
    blockTemplateNamesById,
    sessionTemplatesById,
  }: DragPreviewOverlayProps,
): GhostContent | null {
  if (type === "library") {
    const exercise = exercisesById.get(value);
    return exercise ? { label: exercise.name } : null;
  }
  if (type === "block-template") {
    const name = blockTemplateNamesById?.get(value);
    return name ? { label: name } : null;
  }
  if (type === "session-template") {
    const template = sessionTemplatesById?.get(value);
    return template
      ? { label: `${template.name} (${template.blocks.length} blocks)` }
      : null;
  }
  if (type === "block-exercise") {
    const match = findBlockExercise(blocks, value);
    return match ? { label: match.exercise.name } : null;
  }
  if (type === "block") {
    const block = blocks.find((b) => b.id === value);
    return block ? { label: block.name, accentColor: block.color } : null;
  }
  return null;
}

export function DragPreviewOverlay(props: DragPreviewOverlayProps) {
  const { activeId } = props;
  if (!activeId) return null;
  const separatorIndex = activeId.indexOf(":");
  const type = activeId.slice(0, separatorIndex);
  const value = activeId.slice(separatorIndex + 1);

  const content = resolveGhostContent(type, value, props);
  return content ? <GhostCard {...content} /> : null;
}
