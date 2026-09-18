"use client";

import { DndContext } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { FormQuestionWithOptions } from "@hooper/db";
import { useState } from "react";
import { PortalButton } from "../ui/PortalButton";
import { SortableQuestionRow } from "./SortableQuestionRow";
import { useQuestionListDnd } from "./useQuestionListDnd";

interface QuestionListProps {
  questions: FormQuestionWithOptions[];
  onOpenQuestion: (question: FormQuestionWithOptions) => void;
  onReorder: (reordered: FormQuestionWithOptions[]) => void;
  onAddQuestion: () => Promise<void>;
  onDeleteQuestion: (id: string) => Promise<void>;
}

export function QuestionList({
  questions,
  onOpenQuestion,
  onReorder,
  onAddQuestion,
  onDeleteQuestion,
}: QuestionListProps) {
  const [adding, setAdding] = useState(false);
  const dnd = useQuestionListDnd(questions, onReorder);

  async function handleAdd() {
    setAdding(true);
    await onAddQuestion();
    setAdding(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {questions.length > 0 && (
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
            <div className="flex flex-col gap-2">
              {questions.map((question, i) => (
                <SortableQuestionRow
                  key={question.id}
                  question={question}
                  index={i}
                  onOpen={() => onOpenQuestion(question)}
                  onDelete={() => onDeleteQuestion(question.id)}
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
      )}
      <PortalButton
        variant="secondary"
        className="w-fit"
        onClick={handleAdd}
        disabled={adding}>
        {adding ? "Adding…" : "+ Add question"}
      </PortalButton>
    </div>
  );
}
