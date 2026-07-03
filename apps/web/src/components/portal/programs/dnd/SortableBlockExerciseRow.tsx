"use client";

import { cn } from "@/src/lib/cn";
import {
  formatMeasurementCompact,
  measurementStatColumns,
} from "@/src/lib/measurementFormat";
import { useSortable } from "@dnd-kit/sortable";
import type { BlockExerciseWithDetails } from "@hooper/db";
import { useDragIndicator, type DragIndicator } from "./DragIndicatorContext";

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

function XIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function ExerciseIcon() {
  return (
    <div className="bg-portal-bg border-portal-border text-portal-text3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round">
        <path d="M4 8v8M8 6v12M16 6v12M20 8v8M8 12h8" />
      </svg>
    </div>
  );
}

function StatColumn({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex w-11 flex-shrink-0 flex-col items-center">
      <span className="text-portal-text1 text-sm font-extrabold">{value}</span>
      <span className="text-portal-text3 text-[9px] font-semibold tracking-wide">
        {label}
      </span>
    </div>
  );
}

function RowBody({
  blockExercise,
  dense,
}: {
  blockExercise: BlockExerciseWithDetails;
  dense?: boolean;
}) {
  if (dense) {
    return (
      <>
        <div className="min-w-0 flex-1">
          <div className="text-portal-text1 truncate text-[12px] font-semibold">
            {blockExercise.exercise.name}
          </div>
        </div>
        <div className="text-portal-text3 flex-shrink-0 text-[11px]">
          {formatMeasurementCompact(blockExercise)}
        </div>
      </>
    );
  }

  return (
    <>
      <ExerciseIcon />
      <div className="min-w-0 flex-1">
        <div className="text-portal-text1 truncate text-[13px] font-bold">
          {blockExercise.exercise.name}
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
  readOnly?: boolean;
  dense?: boolean;
  onOpen?: () => void;
  onRemove?: () => void;
}

export function SortableBlockExerciseRow({
  blockExercise,
  readOnly,
  dense,
  onOpen,
  onRemove,
}: SortableBlockExerciseRowProps) {
  const rowId = `block-exercise:${blockExercise.id}`;
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: rowId,
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
        "border-portal-border relative flex touch-none items-center gap-2 border-b select-none last:border-b-0",
        dense ? "px-3 py-2" : "px-3.5 py-2.5",
        isDragging && "opacity-30",
        !readOnly && "hover:bg-portal-bg cursor-grab active:cursor-grabbing",
      )}
      onClick={readOnly ? undefined : onOpen}
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
        <GripIcon />
      </span>
      <RowBody blockExercise={blockExercise} dense={dense} />
      {!readOnly && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="text-portal-text3 hover:text-portal-text1 flex-shrink-0">
          <XIcon />
        </button>
      )}
    </div>
  );
}
