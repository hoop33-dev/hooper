import type { Result } from "@/src/lib/result";
import { err, ok, toErrorMessage } from "@/src/lib/result";
import { createClient } from "@/src/lib/supabase/server";
import type {
  FormQuestionOptionRow,
  FormQuestionRow,
  FormQuestionType,
  FormQuestionUnit,
  FormRow,
  FormSummary,
  FormWithQuestions,
} from "@hooper/db";
import { cache } from "react";

const QUESTION_SELECT = "*, form_question_options(*)";

type RawQuestion = FormQuestionRow & {
  form_question_options: FormQuestionOptionRow[];
};
type RawForm = FormRow & { form_questions: RawQuestion[] };

export type CreateFormInput = {
  name: string;
  description?: string;
  created_by: string;
};

export type UpdateFormInput = {
  name?: string;
  description?: string | null;
};

export type CreateFormQuestionInput = {
  form_id: string;
  position: number;
  prompt: string;
  description?: string | null;
  type: FormQuestionType;
  required?: boolean;
  min_value?: number | null;
  max_value?: number | null;
  unit?: FormQuestionUnit | null;
  min_label?: string | null;
  max_label?: string | null;
  options?: string[];
};

export type UpdateFormQuestionInput = {
  prompt?: string;
  description?: string | null;
  type?: FormQuestionType;
  required?: boolean;
  min_value?: number | null;
  max_value?: number | null;
  unit?: FormQuestionUnit | null;
  min_label?: string | null;
  max_label?: string | null;
  options?: string[];
};

/** Request-scoped dedup: the programs list page and every program canvas page
 * read forms alongside their main data. Does not persist across navigations. */
export const listForms = cache(async (): Promise<Result<FormSummary[]>> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("forms")
      .select("*, form_questions(count), programs(count)")
      .order("updated_at", { ascending: false });

    if (error) return err(error.message);

    const rows = (data ?? []).map((row) => {
      const questionCount = Array.isArray(row.form_questions)
        ? ((row.form_questions[0] as { count: number } | undefined)?.count ?? 0)
        : 0;
      const programCount = Array.isArray(row.programs)
        ? ((row.programs[0] as { count: number } | undefined)?.count ?? 0)
        : 0;
      return { ...row, questionCount, programCount };
    });

    return ok(rows as unknown as FormSummary[]);
  } catch (e) {
    return err(toErrorMessage(e));
  }
});

export async function getFormById(
  id: string,
): Promise<Result<FormWithQuestions>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("forms")
      .select(`*, form_questions(${QUESTION_SELECT})`)
      .eq("id", id)
      .single();

    if (error) return err(error.message);

    const raw = data as unknown as RawForm;
    const questions = [...raw.form_questions]
      .sort((a, b) => a.position - b.position)
      .map(({ form_question_options, ...question }) => ({
        ...question,
        options: [...form_question_options].sort(
          (a, b) => a.position - b.position,
        ),
      }));

    return ok({ ...raw, questions });
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function createForm(
  input: CreateFormInput,
): Promise<Result<FormRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("forms")
      .insert({
        name: input.name,
        description: input.description ?? null,
        created_by: input.created_by,
      })
      .select()
      .single();

    if (error) return err(error.message);
    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function updateForm(
  id: string,
  input: UpdateFormInput,
): Promise<Result<FormRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("forms")
      .update({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return err(error.message);
    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function deleteForm(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("forms").delete().eq("id", id);
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

async function replaceQuestionOptions(
  questionId: string,
  options: string[],
): Promise<Result<void>> {
  const supabase = await createClient();
  const { error: deleteError } = await supabase
    .from("form_question_options")
    .delete()
    .eq("question_id", questionId);
  if (deleteError) return err(deleteError.message);

  if (options.length === 0) return ok(undefined);

  const { error: insertError } = await supabase
    .from("form_question_options")
    .insert(
      options.map((label, position) => ({
        question_id: questionId,
        position,
        label,
      })),
    );
  if (insertError) return err(insertError.message);
  return ok(undefined);
}

export async function createFormQuestion(
  input: CreateFormQuestionInput,
): Promise<Result<FormQuestionRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("form_questions")
      .insert({
        form_id: input.form_id,
        position: input.position,
        prompt: input.prompt,
        description: input.description ?? null,
        type: input.type,
        required: input.required ?? true,
        min_value: input.min_value ?? null,
        max_value: input.max_value ?? null,
        unit: input.unit ?? null,
        min_label: input.min_label ?? null,
        max_label: input.max_label ?? null,
      })
      .select()
      .single();

    if (error) return err(error.message);

    if (input.type === "dropdown" && input.options?.length) {
      const optionsResult = await replaceQuestionOptions(
        data.id,
        input.options,
      );
      if (!optionsResult.ok) return err(optionsResult.error);
    }

    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function updateFormQuestion(
  id: string,
  input: UpdateFormQuestionInput,
): Promise<Result<FormQuestionRow>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("form_questions")
      .update({
        ...(input.prompt !== undefined && { prompt: input.prompt }),
        ...("description" in input && { description: input.description }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.required !== undefined && { required: input.required }),
        ...("min_value" in input && { min_value: input.min_value }),
        ...("max_value" in input && { max_value: input.max_value }),
        ...("unit" in input && { unit: input.unit }),
        ...("min_label" in input && { min_label: input.min_label }),
        ...("max_label" in input && { max_label: input.max_label }),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return err(error.message);

    if (input.options !== undefined) {
      const optionsResult = await replaceQuestionOptions(id, input.options);
      if (!optionsResult.ok) return err(optionsResult.error);
    }

    return ok(data);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

export async function deleteFormQuestion(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("form_questions")
      .delete()
      .eq("id", id);
    if (error) return err(error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}

/** Issues one UPDATE per row rather than a single upsert — an upsert's
 * candidate row only carries {id, position}, and Postgres still evaluates
 * the INSERT policy's WITH CHECK against that partial row even when the
 * conflict redirects to UPDATE, so the omitted form_id reads as NULL and
 * fails `form_id IN (...)`. A plain UPDATE only runs under the UPDATE
 * policy, checked against the row's real, unchanged form_id. */
export async function reorderFormQuestions(
  updates: { id: string; position: number }[],
): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const results = await Promise.all(
      updates.map(({ id, position }) =>
        supabase.from("form_questions").update({ position }).eq("id", id),
      ),
    );

    const failed = results.find((r) => r.error);
    if (failed?.error) return err(failed.error.message);
    return ok(undefined);
  } catch (e) {
    return err(toErrorMessage(e));
  }
}
