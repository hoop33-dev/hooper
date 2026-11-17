"use client";

import { cn } from "@/src/lib/cn";
import { useDraggable } from "@dnd-kit/core";
import type { LibrarySequenceWithDetails } from "@hooper/db";
import {
  SequenceChainText,
  SequenceStepList,
  sequenceSummary,
} from "../../sequences/SequenceChain";
import { ChainIcon } from "../../ui/icons";

export function sequenceDragId(sequenceId: string): string {
  return `sequence-template:${sequenceId}`;
}

function unitNames(sequence: LibrarySequenceWithDetails): string[] {
  return [
    ...new Set(
      sequence.measurements
        .filter((m) => m.set_index === 0)
        .sort((a, b) => a.position - b.position)
        .map((m) => m.unit_type),
    ),
  ];
}

/** A library sequence to drag into a block: a card on the program shelf, a
 * row in the session sidebar. */
export function DraggableSequenceRow({
  sequence,
  variant = "list",
  isSelected = false,
}: {
  sequence: LibrarySequenceWithDetails;
  variant?: "list" | "card";
  isSelected?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: sequenceDragId(sequence.id),
  });
  const summary = sequenceSummary(sequence.sets, unitNames(sequence));

  if (variant === "card") {
    return (
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className={cn(
          "border-portal-border w-[200px] flex-shrink-0 cursor-grab overflow-hidden rounded-lg border bg-white select-none active:cursor-grabbing",
          isDragging && "opacity-30",
          isSelected && "border-portal-orange ring-portal-orange ring-1",
        )}>
        <div className="border-portal-border bg-portal-orange-soft text-portal-orange flex items-center gap-1.5 border-b px-2.5 py-1.5">
          <ChainIcon size={12} />
          <span className="text-portal-text1 truncate text-[11px] font-bold">
            {sequence.name}
          </span>
        </div>
        <div className="px-2.5 py-1.5">
          <SequenceStepList sequence={sequence} />
          <div className="text-portal-text3 mt-1 truncate text-[9.5px]">
            {summary}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "border-portal-border hover:bg-portal-orange-soft flex cursor-grab items-center gap-2.5 border-b px-3.5 py-2.5 select-none active:cursor-grabbing",
        isDragging && "opacity-30",
        isSelected && "bg-portal-orange-soft border-portal-orange",
      )}>
      <span className="border-portal-orange/30 bg-portal-orange-soft text-portal-orange flex h-8 w-11 shrink-0 items-center justify-center rounded-md border">
        <ChainIcon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-portal-text1 truncate text-[12px] font-semibold">
          {sequence.name}
        </div>
        <SequenceChainText
          sequence={sequence}
          className="mt-0.5 text-[10px] leading-snug"
        />
      </div>
    </div>
  );
}
