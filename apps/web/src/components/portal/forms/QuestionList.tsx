"use client";

import { DndContext } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { FormQuestionWithOptions } from "@hooper/db";
import { SortableQuestionRow } from "./SortableQuestionRow";
import { useQuestionListDnd } from "./useQuestionListDnd";

interface QuestionListProps {
  questions: FormQuestionWithOptions[];
  onOpenQuestion: (question: FormQuestionWithOptions) => void;
  onReorder: (reordered: FormQuestionWithOptions[]) => void;
  onDeleteQuestion: (id: string) => Promise<void>;
  onToggleRequired: (question: FormQuestionWithOptions) => void;
}

export function QuestionList({
  questions,
  onOpenQuestion,
  onReorder,
  onDeleteQuestion,
  onToggleRequired,
}: QuestionListProps) {
  const dnd = useQuestionListDnd(questions, onReorder);

  return (
    <DndContext
      sensors={dnd.sensors}
      collisionDetection={dnd.collisionDetection}
      onDragStart={dnd.handleDragStart}
      onDragMove={dnd.handleDragMove}
      onDragEnd={dnd.handleDragEnd}
      onDragCancel={dnd.handleDragCancel}>
      <SortableContext
        items={questions.map((q) => q.id)}
        strategy={verticalListSortingStrategy}>
        <div className="flex flex-col">
          {questions.map((question, i) => (
            <SortableQuestionRow
              key={question.id}
              question={question}
              index={i}
              onOpen={() => onOpenQuestion(question)}
              onDelete={() => onDeleteQuestion(question.id)}
              onToggleRequired={() => onToggleRequired(question)}
              isDropTarget={
                !!dnd.activeId &&
                dnd.dropTarget?.overId === question.id &&
                dnd.activeId !== question.id
              }
              dropAfter={dnd.dropTarget?.after ?? false}
              dragActive={!!dnd.activeId}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
