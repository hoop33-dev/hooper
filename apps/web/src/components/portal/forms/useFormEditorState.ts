import type {
  CreateFormQuestionInput,
  UpdateFormQuestionInput,
} from "@/src/services/form.service";
import type {
  FormQuestionRow,
  FormQuestionWithOptions,
  FormRow,
  FormWithQuestions,
  ProgramRow,
  ProgramSummary,
} from "@hooper/db";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEditFormData } from "./FormEditDrawer";
import { useProgramAttachments } from "./useProgramAttachments";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

export interface FormEditorActions {
  createQuestionAction: (
    input: CreateFormQuestionInput,
  ) => Promise<ActionResult<FormQuestionRow>>;
  updateQuestionAction: (
    id: string,
    input: UpdateFormQuestionInput,
  ) => Promise<ActionResult<FormQuestionRow>>;
  deleteQuestionAction: (id: string) => Promise<ActionResult>;
  reorderQuestionsAction: (
    updates: { id: string; position: number }[],
  ) => Promise<ActionResult>;
  attachFormToProgramAction: (
    programId: string,
    formId: string | null,
  ) => Promise<ActionResult<ProgramRow>>;
  updateFormAction: (
    id: string,
    data: FormEditFormData,
  ) => Promise<ActionResult<FormRow>>;
  deleteFormAction: (id: string) => Promise<ActionResult>;
}

/** Owns the form editor's modal/drawer state and every mutation handler,
 * keeping FormEditorShell itself down to layout/JSX. */
export function useFormEditorState(
  form: FormWithQuestions,
  initialPrograms: ProgramSummary[],
  actions: FormEditorActions,
) {
  const router = useRouter();
  const [questions, setQuestions] = useState(form.questions);
  const { programs, handleAttach, handleDetach } = useProgramAttachments(
    form.id,
    initialPrograms,
    actions.attachFormToProgramAction,
  );
  const [editingQuestion, setEditingQuestion] =
    useState<FormQuestionWithOptions | null>(null);
  const [editingForm, setEditingForm] = useState(false);

  // Resyncs from the server-fetched form whenever a refresh brings a new
  // object in (add/delete/save all trigger one) — reorders below manage
  // `questions` themselves in the meantime, so this only fires on other
  // mutations or once a reorder's own refresh lands.
  useEffect(() => {
    setQuestions(form.questions);
  }, [form.questions]);

  async function handleAddQuestion() {
    const nextPosition =
      questions.length === 0
        ? 0
        : Math.max(...questions.map((q) => q.position)) + 1;
    const result = await actions.createQuestionAction({
      form_id: form.id,
      position: nextPosition,
      prompt: "Untitled question",
      type: "short_text",
    });
    if (result.ok && result.data) {
      router.refresh();
      setEditingQuestion({ ...result.data, options: [] });
    }
  }

  async function handleSaveQuestion(data: UpdateFormQuestionInput) {
    if (!editingQuestion) return;
    const result = await actions.updateQuestionAction(editingQuestion.id, data);
    if (result.ok) {
      router.refresh();
      setEditingQuestion(null);
    }
  }

  async function handleDeleteQuestion() {
    if (!editingQuestion) return;
    await actions.deleteQuestionAction(editingQuestion.id);
    router.refresh();
    setEditingQuestion(null);
  }

  /** Applies the new order immediately (before the server call resolves) so
   * the drop feels instant, then snaps back to the pre-drag order only if
   * the server rejects it — mirroring the program canvas's session-column
   * reorder, the one reorder path there that rolls back on failure. */
  async function handleReorder(reordered: FormQuestionWithOptions[]) {
    const previous = questions;
    setQuestions(reordered);
    const result = await actions.reorderQuestionsAction(
      reordered.map((q, position) => ({ id: q.id, position })),
    );
    if (!result.ok) {
      setQuestions(previous);
      return;
    }
    router.refresh();
  }

  async function handleSaveForm(data: FormEditFormData) {
    const result = await actions.updateFormAction(form.id, data);
    if (result.ok) {
      router.refresh();
      setEditingForm(false);
    }
  }

  async function handleDeleteForm() {
    await actions.deleteFormAction(form.id);
    router.push("/forms");
  }

  return {
    questions,
    programs,
    editingQuestion,
    setEditingQuestion,
    editingForm,
    setEditingForm,
    handleAddQuestion,
    handleSaveQuestion,
    handleDeleteQuestion,
    handleReorder,
    handleAttach,
    handleDetach,
    handleSaveForm,
    handleDeleteForm,
  };
}
