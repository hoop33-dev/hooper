import type { UpdateFormQuestionInput } from "@/src/services/form.service";
import type { FormQuestionWithOptions } from "@hooper/db";
import type { useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";
import type { FormEditorActions } from "./useFormEditorState";

interface QuestionMutationsArgs {
  formId: string;
  questions: FormQuestionWithOptions[];
  setQuestions: Dispatch<SetStateAction<FormQuestionWithOptions[]>>;
  editingQuestion: FormQuestionWithOptions | null;
  setEditingQuestion: Dispatch<SetStateAction<FormQuestionWithOptions | null>>;
  actions: FormEditorActions;
  router: ReturnType<typeof useRouter>;
}

/** Add / save / delete for form questions, each patching the local
 * `questions` list before the server round-trip so the row list never lags
 * the editor by a refresh (see router-refresh-modal-gap), rolling back on
 * failure. Reorder + attach stay in useFormEditorState with the rest. */
export function useQuestionMutations({
  formId,
  questions,
  setQuestions,
  editingQuestion,
  setEditingQuestion,
  actions,
  router,
}: QuestionMutationsArgs) {
  async function handleAddQuestion() {
    const nextPosition =
      questions.length === 0
        ? 0
        : Math.max(...questions.map((q) => q.position)) + 1;
    const result = await actions.createQuestionAction({
      form_id: formId,
      position: nextPosition,
      prompt: "",
      type: "short_text",
    });
    if (result.ok && result.data) {
      const created = { ...result.data, options: [] };
      setQuestions((prev) => [...prev, created]);
      setEditingQuestion(created);
      router.refresh();
    }
  }

  async function handleSaveQuestion(data: UpdateFormQuestionInput) {
    if (!editingQuestion) return;
    const id = editingQuestion.id;
    const rollback = questions;
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              ...data,
              options:
                data.options?.map((label, position) => ({
                  question_id: id,
                  position,
                  label,
                })) ?? q.options,
            }
          : q,
      ),
    );
    setEditingQuestion(null);
    const result = await actions.updateQuestionAction(id, data);
    if (result.ok && result.data) {
      const row = result.data;
      setQuestions((prev) =>
        prev.map((q) => (q.id === row.id ? { ...q, ...row } : q)),
      );
      router.refresh();
    } else {
      setQuestions(rollback);
    }
  }

  async function handleDeleteQuestion(id: string) {
    const rollback = questions;
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    if (editingQuestion?.id === id) setEditingQuestion(null);
    const result = await actions.deleteQuestionAction(id);
    if (result.ok) router.refresh();
    else setQuestions(rollback);
  }

  return { handleAddQuestion, handleSaveQuestion, handleDeleteQuestion };
}
