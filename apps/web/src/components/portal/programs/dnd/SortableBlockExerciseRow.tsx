"use client";

import { cn } from "@/src/lib/cn";
import {
  formatMeasurementCompact,
  measurementStatColumns,
} from "@/src/lib/measurementFormat";
import type { Active, Over } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BlockExerciseWithDetails } from "@hooper/db";
import { isInsertAfter } from "./insertPosition";

/** Only an exercise drag (not a block drag) shows this row's insertion line. */
function computeRowDropIndicator(
  rowId: string,
  active: Active | null,
  over: Over | null,
) {
  const isExerciseDrag =
    typeof active?.id === "string" && active.id.startsWith("block-exercise:");
  const isDropTarget =
    isExerciseDrag && over?.id === rowId && active?.id !== rowId;
  return { isDropTarget, after: isDropTarget && isInsertAfter(active, over) };
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
          <StatColumn key={col.label} label={col.label} value={col.value} />
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    over,
    active,
  } = useSortable({ id: rowId });
  // Dragging never depends on readOnly — a coach can always move exercises
  // around, even in a non-focused session on the canvas. readOnly only
  // gates editing (opening the modal, removing a row).
  const { isDropTarget, after } = computeRowDropIndicator(rowId, active, over);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "border-portal-border relative flex items-center gap-2 border-b last:border-b-0",
        dense ? "px-3 py-2" : "px-3.5 py-2.5",
        isDragging && "opacity-30",
        !readOnly && "hover:bg-portal-bg cursor-pointer",
      )}
      onClick={readOnly ? undefined : onOpen}>
      {isDropTarget && (
        <div
          className={cn(
            "bg-portal-orange absolute inset-x-0 h-0.5",
            after ? "bottom-0" : "top-0",
          )}
        />
      )}
      <button
        type="button"
        className="text-portal-text3 flex-shrink-0 cursor-grab touch-none active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
        {...attributes}
        {...listeners}>
        <GripIcon />
      </button>
      <RowBody blockExercise={blockExercise} dense={dense} />
      {!readOnly && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-portal-text3 hover:text-portal-text1 flex-shrink-0">
          <XIcon />
        </button>
      )}
    </div>
  );
}
