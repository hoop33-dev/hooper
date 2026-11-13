import { FormEditorShell } from "@/src/components/portal/forms/FormEditorShell";
import { getFormById } from "@/src/services/form.service";
import { listPrograms } from "@/src/services/program.service";
import { notFound } from "next/navigation";
import { attachFormToProgramAction } from "../../programs/actions";
import { deleteFormAction, updateFormAction } from "../actions";
import {
  createFormQuestionAction,
  deleteFormQuestionAction,
  reorderFormQuestionsAction,
  updateFormQuestionAction,
} from "./actions";

export default async function FormEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [formResult, programsResult] = await Promise.all([
    getFormById(id),
    listPrograms(),
  ]);

  if (!formResult.ok) notFound();

  const programs = programsResult.ok ? programsResult.data : [];

  return (
    <FormEditorShell
      form={formResult.data}
      programs={programs}
      createQuestionAction={createFormQuestionAction}
      updateQuestionAction={updateFormQuestionAction}
      deleteQuestionAction={deleteFormQuestionAction}
      reorderQuestionsAction={reorderFormQuestionsAction}
      attachFormToProgramAction={attachFormToProgramAction}
      updateFormAction={updateFormAction}
      deleteFormAction={deleteFormAction}
    />
  );
}
