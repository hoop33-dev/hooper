"use client";

import type { FormWithQuestions, ProgramSummary } from "@hooper/db";
import Link from "next/link";
import { PageHeader } from "../ui/PageHeader";
import { PortalButton } from "../ui/PortalButton";
import { AttachedProgramsPanel } from "./AttachedProgramsPanel";
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

function HeaderActions({ onEdit }: { onEdit: () => void }) {
  return (
    <div className="flex flex-col items-end gap-2">
      <Link
        href="/forms"
        className="text-portal-text2 text-xs font-semibold hover:underline">
        ← Back to forms
      </Link>
      <PortalButton variant="secondary" onClick={onEdit}>
        Edit form
      </PortalButton>
    </div>
  );
}

export function FormEditorShell({
  form,
  programs,
  ...actions
}: FormEditorShellProps) {
  const state = useFormEditorState(form, programs, actions);
  const questionCount = state.questions.length;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title={form.name}
        subtitle={`${questionCount} question${questionCount === 1 ? "" : "s"}`}
        action={<HeaderActions onEdit={() => state.setEditingForm(true)} />}
      />
      <div className="flex-1 overflow-y-auto px-7 py-5">
        <div className="mx-auto flex max-w-5xl flex-col gap-5">
          {form.description && (
            <p className="text-portal-text2 text-sm">{form.description}</p>
          )}

          <div className="flex items-start gap-5">
            <div className="min-w-0 flex-[2]">
              <h3 className="text-portal-text1 mb-3 text-sm font-bold">
                Questions
              </h3>
              <QuestionList
                questions={state.questions}
                onOpenQuestion={state.setEditingQuestion}
                onReorder={state.handleReorder}
                onAddQuestion={state.handleAddQuestion}
                onDeleteQuestion={state.handleDeleteQuestion}
              />
            </div>

            <div className="min-w-0 flex-1">
              <AttachedProgramsPanel
                formId={form.id}
                programs={state.programs}
                onAttach={state.handleAttach}
                onDetach={state.handleDetach}
              />
            </div>
          </div>
        </div>
      </div>

      {state.editingQuestion && (
        <QuestionEditModal
          question={state.editingQuestion}
          onClose={() => state.setEditingQuestion(null)}
          onSave={state.handleSaveQuestion}
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
    </div>
  );
}
