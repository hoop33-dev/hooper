"use client";

import { formatProgramSub, plural } from "@/src/lib/format";
import type { FormWithQuestions, ProgramSummary } from "@hooper/db";
import { useState } from "react";
import { DetailListCard, DetailRow, RemoveButton } from "../ui/DetailListCard";
import { LetterTile } from "../ui/LetterTile";
import { PageHeader } from "../ui/PageHeader";
import { PortalButton } from "../ui/PortalButton";
import { SearchPickerModal } from "../ui/SearchPickerModal";
import { FormEditDrawer } from "./FormEditDrawer";
import { QuestionEditModal } from "./QuestionEditModal";
import { QuestionList } from "./QuestionList";
import {
  useFormEditorState,
  type FormEditorActions,
} from "./useFormEditorState";

interface FormEditorShellProps extends FormEditorActions {
  form: FormWithQuestions;
  programs: ProgramSummary[];
}

type FormEditorState = ReturnType<typeof useFormEditorState>;

function AttachedProgramsCard({
  attached,
  onAttachClick,
  onDetach,
}: {
  attached: ProgramSummary[];
  onAttachClick: () => void;
  onDetach: (programId: string) => void;
}) {
  return (
    <DetailListCard
      title="Programs"
      count={attached.length}
      onAdd={onAttachClick}
      addLabel="Attach"
      emptyLabel="Not attached to any programs."
      emptyCta="Attach program">
      {attached.map((p) => (
        <DetailRow
          key={p.id}
          href={`/programs/${p.id}`}
          lead={<LetterTile name={p.name} />}
          title={p.name}
          sub={formatProgramSub(p)}
          trail={<RemoveButton label={p.name} onClick={() => onDetach(p.id)} />}
        />
      ))}
    </DetailListCard>
  );
}

function FormEditorModals({
  form,
  state,
  attachOpen,
  onAttachClose,
}: {
  form: FormWithQuestions;
  state: FormEditorState;
  attachOpen: boolean;
  onAttachClose: () => void;
}) {
  // Programs attached to a different form aren't offered: a program holds
  // at most one form, and silently re-pointing it would detach the other.
  const attachable = state.programs.filter((p) => p.form_id === null);
  return (
    <>
      {state.editingQuestion && (
        <QuestionEditModal
          // Keyed so "Add another" gets a fresh field state for the new row.
          key={state.editingQuestion.id}
          question={state.editingQuestion}
          formName={form.name}
          onClose={() => state.setEditingQuestion(null)}
          onSave={state.handleSaveQuestion}
          onSaveAndAddAnother={async (data) => {
            if (await state.handleSaveQuestion(data)) {
              await state.handleAddQuestion();
            }
          }}
        />
      )}

      {attachOpen && (
        <SearchPickerModal
          title="Attach program"
          subtitle={form.name}
          placeholder="Search programs…"
          items={attachable.map((p) => ({
            id: p.id,
            title: p.name,
            sub: formatProgramSub(p),
            lead: <LetterTile name={p.name} />,
          }))}
          emptyLabel="Every program already has a form attached."
          onAdd={state.handleAttach}
          onClose={onAttachClose}
        />
      )}

      {state.editingForm && (
        <FormEditDrawer
          form={form}
          onClose={() => state.setEditingForm(false)}
          onSave={state.handleSaveForm}
          onDelete={state.handleDeleteForm}
        />
      )}
    </>
  );
}

export function FormEditorShell({
  form,
  programs,
  ...actions
}: FormEditorShellProps) {
  const state = useFormEditorState(form, programs, actions);
  const [attachOpen, setAttachOpen] = useState(false);
  const attached = state.programs.filter((p) => p.form_id === form.id);
  const questionCount = state.questions.length;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title={form.name}
        subtitle={`${plural(questionCount, "question")} and ${plural(attached.length, "program")} attached`}
        backHref="/forms"
        breadcrumbs={[{ label: "Forms", href: "/forms" }, { label: form.name }]}
        action={
          <PortalButton
            variant="secondary"
            onClick={() => state.setEditingForm(true)}>
            Edit form
          </PortalButton>
        }
      />
      <div className="flex-1 overflow-y-auto p-7">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <DetailListCard
            title="Questions"
            count={questionCount}
            onAdd={() => void state.handleAddQuestion()}
            emptyLabel="No questions yet."
            emptyCta="Add question">
            <QuestionList
              questions={state.questions}
              onOpenQuestion={state.setEditingQuestion}
              onReorder={state.handleReorder}
              onDeleteQuestion={state.handleDeleteQuestion}
              onToggleRequired={state.handleToggleRequired}
            />
          </DetailListCard>

          <AttachedProgramsCard
            attached={attached}
            onAttachClick={() => setAttachOpen(true)}
            onDetach={(programId) => void state.handleDetach(programId)}
          />
        </div>
      </div>

      <FormEditorModals
        form={form}
        state={state}
        attachOpen={attachOpen}
        onAttachClose={() => setAttachOpen(false)}
      />
    </div>
  );
}
