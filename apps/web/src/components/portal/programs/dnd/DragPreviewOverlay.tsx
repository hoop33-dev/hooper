import { cn } from "@/src/lib/cn";
import type { BlockWithExercises, ExerciseWithDetails } from "@hooper/db";

interface DragPreviewOverlayProps {
  activeId: string | null;
  blocks: BlockWithExercises[];
  exercisesById: Map<string, ExerciseWithDetails>;
}

function GhostCard({
  label,
  accentColor,
}: {
  label: string;
  accentColor?: string;
}) {
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

export function DragPreviewOverlay({
  activeId,
  blocks,
  exercisesById,
}: DragPreviewOverlayProps) {
  if (!activeId) return null;
  const separatorIndex = activeId.indexOf(":");
  const type = activeId.slice(0, separatorIndex);
  const value = activeId.slice(separatorIndex + 1);

  if (type === "library") {
    const exercise = exercisesById.get(value);
    return exercise ? <GhostCard label={exercise.name} /> : null;
  }

  if (type === "block-exercise") {
    for (const block of blocks) {
      const match = block.exercises.find((e) => e.id === value);
      if (match) return <GhostCard label={match.exercise.name} />;
    }
    return null;
  }

  if (type === "block") {
    const block = blocks.find((b) => b.id === value);
    return block ? (
      <GhostCard label={block.name} accentColor={block.color} />
    ) : null;
  }

  return null;
}
