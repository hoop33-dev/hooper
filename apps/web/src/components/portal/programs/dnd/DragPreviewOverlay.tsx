import { cn } from "@/src/lib/cn";
import type {
  BlockWithExercises,
  ExerciseWithDetails,
  SessionTemplateSummary,
  SessionWithBlocks,
} from "@hooper/db";

interface DragPreviewOverlayProps {
  activeId: string | null;
  blocks: BlockWithExercises[];
  exercisesById: Map<string, ExerciseWithDetails>;
  blockTemplateNamesById?: Map<string, string>;
  sessionTemplatesById?: Map<string, SessionTemplateSummary>;
  sessions?: SessionWithBlocks[];
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

type GhostResolver = (
  value: string,
  props: DragPreviewOverlayProps,
) => GhostContent | null;

/** One lookup per drag source type, dispatched by id prefix below so the
 * component itself stays a single flat render. */
const GHOST_RESOLVERS: Record<string, GhostResolver> = {
  "session-col": (value, { sessions }) => {
    const session = sessions?.find((s) => s.id === value);
    return session ? { label: session.name } : null;
  },
  library: (value, { exercisesById }) => {
    const exercise = exercisesById.get(value);
    return exercise ? { label: exercise.name } : null;
  },
  "block-template": (value, { blockTemplateNamesById }) => {
    const name = blockTemplateNamesById?.get(value);
    return name ? { label: name } : null;
  },
  "session-template": (value, { sessionTemplatesById }) => {
    const template = sessionTemplatesById?.get(value);
    return template
      ? { label: `${template.name} (${template.blocks.length} blocks)` }
      : null;
  },
  "block-exercise": (value, { blocks }) => {
    const match = findBlockExercise(blocks, value);
    return match ? { label: match.exercise.name } : null;
  },
  block: (value, { blocks }) => {
    const block = blocks.find((b) => b.id === value);
    return block ? { label: block.name, accentColor: block.color } : null;
  },
};

function resolveGhostContent(
  type: string,
  value: string,
  props: DragPreviewOverlayProps,
): GhostContent | null {
  return GHOST_RESOLVERS[type]?.(value, props) ?? null;
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
