import { getClient } from "../client";
import type {
  FormQuestionOptionRow,
  FormQuestionRow,
  FormRow,
  FormWithQuestions,
  SessionCompletionRow,
} from "@hooper/db";
import { startOrResumeSession } from "./sessionCompletion.service";

// Mirrors apps/web/src/services/form.service.ts's QUESTION_SELECT/getFormById
// shaping — that file isn't importable from mobile, so it's duplicated here.
const QUESTION_SELECT = "*, form_question_options(*)";

type RawQuestion = FormQuestionRow & {
  form_question_options: FormQuestionOptionRow[];
};
type RawForm = FormRow & { form_questions: RawQuestion[] };

/** The pre-session check-in form attached to a program, if any — a program
 * with no form_id skips straight from ProgramDetail to the session player. */
export async function getProgramForm(
  programId: string,
): Promise<FormWithQuestions | null> {
  const client = getClient();
  const { data: program, error: programError } = await client
    .from("programs")
    .select("form_id")
    .eq("id", programId)
    .single();
  if (programError) throw new Error(programError.message);
  if (!program.form_id) return null;

  const { data, error } = await client
    .from("forms")
    .select(`*, form_questions(${QUESTION_SELECT})`)
    .eq("id", program.form_id)
    .single();
  if (error) throw new Error(error.message);

  const raw = data as unknown as RawForm;
  const questions = [...raw.form_questions]
    .sort((a, b) => a.position - b.position)
    .map(({ form_question_options, ...question }) => ({
      ...question,
      options: [...form_question_options].sort((a, b) => a.position - b.position),
    }));

  return { ...raw, questions };
}

/**
 * Submits the pre-session check-in and starts (or resumes) the session
 * attempt it belongs to — this is the moment a session_completions row
 * comes into existence for a fresh start. Idempotent: if the athlete's
 * in-progress attempt already has a pre_form_response_id (e.g. this ran
 * once and the app was then closed before reaching the player), it's
 * returned as-is rather than recorded twice.
 */
export async function submitPreSessionForm(
  sessionId: string,
  athleteProfileId: string,
  formId: string,
  answers: Record<string, unknown>,
): Promise<SessionCompletionRow> {
  const client = getClient();
  const completion = await startOrResumeSession(sessionId, athleteProfileId);
  if (completion.pre_form_response_id) return completion;

  const { data: response, error: responseError } = await client
    .from("form_responses")
    .insert({
      form_id: formId,
      athlete_profile_id: athleteProfileId,
      session_completion_id: completion.id,
      answers,
    })
    .select()
    .single();
  if (responseError) throw new Error(responseError.message);

  const { data: updated, error: updateError } = await client
    .from("session_completions")
    .update({ pre_form_response_id: response.id })
    .eq("id", completion.id)
    .select()
    .single();
  if (updateError) throw new Error(updateError.message);
  return updated;
}
