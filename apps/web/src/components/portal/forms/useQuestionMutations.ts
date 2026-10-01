import type { UpdateFormQuestionInput } from "@/src/services/form.service";
import type { FormQuestionWithOptions } from "@hooper/db";
import type { useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";
import { useToast } from "../ui/Toast";
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
 * the editor by a refresh (see router-refresh-modal-gap), rolling back the
 * list *and* the open editor on failure and surfacing the error as a toast.
 * Reorder + attach stay in useFormEditorState with the rest. */
export function useQuestionMutations({
  formId,
  questions,
  setQuestions,
  editingQuestion,
  setEditingQuestion,
  actions,
  router,
}: QuestionMutationsArgs) {
  const { showError } = useToast();
  const handleToggleRequired = useRequiredToggle({
    questions,
    setQuestions,
    actions,
    router,
  });

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
    } else {
      showError(result.error ?? "Couldn't add the question.");
    }
  }

  /** Resolves true once saved (and the editor closed), false if the save
   * failed and the editor stayed open — "Add another" chains on it. */
  async function handleSaveQuestion(
    data: UpdateFormQuestionInput,
  ): Promise<boolean> {
    if (!editingQuestion) return false;
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
    const result = await actions.updateQuestionAction(id, data);
    if (result.ok && result.data) {
      const row = result.data;
      setQuestions((prev) =>
        prev.map((q) => (q.id === row.id ? { ...q, ...row } : q)),
      );
      setEditingQuestion(null);
      router.refresh();
      return true;
    }
    // Leave the editor open with the user's changes intact.
    setQuestions(rollback);
    showError(result.error ?? "Couldn't save your changes.");
    return false;
  }

  async function handleDeleteQuestion(id: string) {
    const rollback = questions;
    const rollbackEditing = editingQuestion;
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    if (editingQuestion?.id === id) setEditingQuestion(null);
    const result = await actions.deleteQuestionAction(id);
    if (result.ok) {
      router.refresh();
    } else {
      setQuestions(rollback);
      if (rollbackEditing?.id === id) setEditingQuestion(rollbackEditing);
      showError(result.error ?? "Couldn't delete the question.");
    }
  }

  return {
    handleAddQuestion,
    handleSaveQuestion,
    handleDeleteQuestion,
    handleToggleRequired,
  };
}

/** The row's Required/Optional chip — flips just `required`, without
 * opening the editor. */
function useRequiredToggle({
  questions,
  setQuestions,
  actions,
  router,
}: Pick<
  QuestionMutationsArgs,
  "questions" | "setQuestions" | "actions" | "router"
>) {
  const { showError } = useToast();

  return async function handleToggleRequired(
    question: FormQuestionWithOptions,
  ) {
    const rollback = questions;
    const required = !question.required;
    setQuestions((prev) =>
      prev.map((q) => (q.id === question.id ? { ...q, required } : q)),
    );
    const result = await actions.updateQuestionAction(question.id, {
      required,
    });
    if (result.ok) {
      router.refresh();
    } else {
      setQuestions(rollback);
      showError(result.error ?? "Couldn't update the question.");
    }
  };
}
