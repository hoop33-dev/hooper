import {
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { FormQuestionWithOptions } from "@hooper/db";
import { useMemo, useRef, useState } from "react";
import { isInsertAfter } from "../programs/dnd/insertPosition";

type DropTarget = { overId: string; after: boolean } | null;

/** Reorders `questions` by moving `activeId` to just before/after `overId`,
 * matching the insertion line each row renders from the same overId/after
 * pair, rather than dnd-kit's default "swap to over's slot" semantics. */
function reorderQuestions(
  questions: FormQuestionWithOptions[],
  activeId: string,
  overId: string,
  after: boolean,
): FormQuestionWithOptions[] {
  const active = questions.find((q) => q.id === activeId);
  if (!active) return questions;

  const without = questions.filter((q) => q.id !== activeId);
  let insertAt = without.findIndex((q) => q.id === overId);
  if (insertAt === -1) return questions;
  if (after) insertAt += 1;

  const result = [...without];
  result.splice(insertAt, 0, active);
  return result;
}

/** Drives the program editor's static-row-plus-insertion-line drag style
 * (see SortableBlockExerciseRow) for the flat question list: rows never
 * move via CSS transform, only a thin line tracks the current drop point. */
export function useQuestionListDnd(
  questions: FormQuestionWithOptions[],
  onReorder: (reordered: FormQuestionWithOptions[]) => void,
) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget>(null);
  const pointerYRef = useRef<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const collisionDetection: CollisionDetection = useMemo(
    () => (args) => {
      pointerYRef.current = args.pointerCoordinates?.y ?? null;
      return closestCenter(args);
    },
    [],
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragMove(event: DragMoveEvent) {
    const { over } = event;
    if (!over) {
      setDropTarget(null);
      return;
    }
    setDropTarget({
      overId: String(over.id),
      after: isInsertAfter(pointerYRef.current, over),
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const target = dropTarget;
    setActiveId(null);
    setDropTarget(null);

    const draggedId = String(event.active.id);
    if (!target || target.overId === draggedId) return;

    onReorder(
      reorderQuestions(questions, draggedId, target.overId, target.after),
    );
  }

  function handleDragCancel() {
    setActiveId(null);
    setDropTarget(null);
  }

  return {
    activeId,
    dropTarget,
    sensors,
    collisionDetection,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
  };
}
