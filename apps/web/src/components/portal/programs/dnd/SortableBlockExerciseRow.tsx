"use client";

import {
  resolveDisplayName,
  resolveStylePill,
} from "@/src/lib/blockExerciseDisplay";
import { cn } from "@/src/lib/cn";
import {
  formatMeasurementCompact,
  measurementStatColumns,
} from "@/src/lib/measurementFormat";
import { useSortable } from "@dnd-kit/sortable";
import type { BlockExerciseWithDetails, ExerciseStyleRow } from "@hooper/db";
import { ExerciseVideoThumbnail } from "../../exercises/ExerciseVideoThumbnail";
import { SpinnerIcon } from "../../ui/icons";
import { InlineConfirmDelete } from "../../ui/InlineConfirmDelete";
import { useDragIndicator, type DragIndicator } from "./DragIndicatorContext";
import { isPending } from "./pendingRows";

/** A row shows an insertion line for exercise reorders and library drops
 * (not block drags, which reorder whole blocks). */
function computeRowDropIndicator(rowId: string, indicator: DragIndicator) {
  const activeId = indicator.activeId ?? "";
  const isExerciseLike =
    activeId.startsWith("block-exercise:") || activeId.startsWith("library:");
  const isDropTarget =
    isExerciseLike && indicator.overId === rowId && activeId !== rowId;
  return { isDropTarget, after: isDropTarget && indicator.after };
}

function GripIcon() {
  return (
    <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
      <circle cx="2" cy="2" r="1.2" />
      <circle cx="2" cy="6" r="1.2" />
      <circle cx="2" cy="10" r="1.2" />
      <circle cx="6" cy="2" r="1.2" />
      <circle cx="6" cy="6" r="1.2" />
      <circle cx="6" cy="10" r="1.2" />
    </svg>
  );
}

function StatColumn({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-16 flex-shrink-0 flex-col items-center">
      <span className="text-portal-text1 text-sm font-extrabold whitespace-nowrap">
        {value}
      </span>
      <span className="text-portal-text3 text-center text-[9px] font-semibold tracking-wide">
        {label}
      </span>
    </div>
  );
}

function StylePill({ label }: { label: string }) {
  return (
    <span className="border-portal-border bg-portal-bg text-portal-text2 flex-shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold tracking-wide">
      {label}
    </span>
  );
}

function RowBody({
  blockExercise,
  styles,
  dense,
}: {
  blockExercise: BlockExerciseWithDetails;
  styles: ExerciseStyleRow[];
  dense?: boolean;
}) {
  const name = resolveDisplayName(blockExercise);

  if (dense) {
    return (
      <>
        <div className="min-w-0 flex-1">
          <div className="text-portal-text1 truncate text-[12px] font-semibold">
            {name}
          </div>
        </div>
        <div className="text-portal-text3 flex-shrink-0 text-[11px]">
          {formatMeasurementCompact(blockExercise)}
        </div>
      </>
    );
  }

  const stylePill = resolveStylePill(blockExercise, styles);

  return (
    <>
      <ExerciseVideoThumbnail
        exercise={blockExercise.exercise}
        className="h-9 w-16 flex-shrink-0 rounded-md"
        fallbackClassName="text-[10px]"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <div className="text-portal-text1 truncate text-[13px] font-bold">
            {name}
          </div>
          {stylePill && <StylePill label={stylePill} />}
        </div>
        {blockExercise.notes && (
          <div className="text-portal-text3 mt-0.5 truncate text-[11px]">
            {blockExercise.notes}
          </div>
        )}
      </div>
      <div className="flex flex-shrink-0 items-center gap-3">
        {measurementStatColumns(blockExercise).map((col) => (
          <StatColumn key={col.key} label={col.label} value={col.value} />
        ))}
      </div>
    </>
  );
}

interface SortableBlockExerciseRowProps {
  blockExercise: BlockExerciseWithDetails;
  styles: ExerciseStyleRow[];
  readOnly?: boolean;
  dense?: boolean;
  onOpen?: () => void;
  onRemove?: () => void;
}

export function SortableBlockExerciseRow({
  blockExercise,
  styles,
  readOnly,
  dense,
  onOpen,
  onRemove,
}: SortableBlockExerciseRowProps) {
  const pending = isPending(blockExercise);
  const rowId = `block-exercise:${blockExercise.id}`;
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: rowId,
    disabled: pending,
  });
  // Dragging never depends on readOnly — a coach can always move exercises
  // around, even in a non-focused session on the canvas. readOnly only
  // gates editing (opening the modal, removing a row). The insertion line is
  // driven by the shared indicator so it tracks the pointer continuously.
  const { isDropTarget, after } = computeRowDropIndicator(
    rowId,
    useDragIndicator(),
  );

  // No CSS transform is applied: items stay put while dragging so only the
  // insertion line moves (per design), and static rects keep the line stable.
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border-portal-border group relative flex touch-none items-center gap-2 border-b select-none last:border-b-0",
        // Pinned so a pending row (fewer/shorter contents — no icon, no
        // remove button, a short "1×" instead of a full measurement string)
        // renders at the exact same height as a real one instead of
        // shrinking to fit less content.
        dense ? "min-h-9 px-3 py-2" : "min-h-14 px-3.5 py-2.5",
        isDragging && "opacity-30",
        pending && "opacity-50",
        !readOnly &&
          !pending &&
          "hover:bg-portal-bg cursor-grab active:cursor-grabbing",
      )}
      onClick={readOnly || pending ? undefined : onOpen}
      {...attributes}
      {...listeners}>
      {isDropTarget && (
        <div
          className={cn(
            "bg-portal-orange pointer-events-none absolute inset-x-0 z-10 h-0.5",
            after ? "-bottom-px" : "-top-px",
          )}
        />
      )}
      <span className="text-portal-text3 flex-shrink-0">
        {pending ? <SpinnerIcon size={10} /> : <GripIcon />}
      </span>
      <RowBody blockExercise={blockExercise} styles={styles} dense={dense} />
      {!readOnly && !pending && onRemove && (
        <InlineConfirmDelete
          onDelete={onRemove}
          idleTitle="Remove exercise"
          idleClassName="text-portal-text3 opacity-0 hover:text-portal-text1 group-focus-within:opacity-100 group-hover:opacity-100"
        />
      )}
    </div>
  );
}
