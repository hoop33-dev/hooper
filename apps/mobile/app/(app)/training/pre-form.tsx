import {
  FormQuestionField,
  defaultAnswerForQuestion,
  type FormAnswerValue,
} from "@/src/components/forms/FormQuestionField";
import {
  Button,
  Caption,
  H2,
  Lead,
  RowTitle,
  ScreenHeader,
} from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import {
  getLastFormResponse,
  getProgramForm,
  submitPreSessionForm,
} from "@/src/services/formResponse.service";
import { startOrResumeSession } from "@/src/services/sessionCompletion.service";
import { useAuthStore } from "@/src/stores/auth.store";
import type { FormQuestionWithOptions, FormWithQuestions } from "@hooper/db";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

type Answers = Record<string, FormAnswerValue>;

/** The athlete's prior answer to this question, if it's still usable —
 * short_text is deliberately never carried forward (typed answers go stale
 * fast), and a stale dropdown value that no longer matches any option is
 * dropped rather than silently selecting nothing behind the scenes. */
function priorAnswerValue(
  question: FormQuestionWithOptions,
  prior: unknown,
): FormAnswerValue | undefined {
  switch (question.type) {
    case "number":
    case "slider":
      return typeof prior === "number" ? prior : undefined;
    case "yes_no":
      return typeof prior === "boolean" ? prior : undefined;
    case "dropdown":
      return typeof prior === "string" &&
        question.options.some((o) => o.label === prior)
        ? prior
        : undefined;
    case "short_text":
      return undefined;
  }
}

/** Seeds the answer state for *optional* questions only, so one counts as
 * already answered — and gets submitted as-is if the athlete never touches
 * it — whenever it has something sensible to start from: their own last
 * response (all types but short_text) falling back to the field's cosmetic
 * default (number/slider only; dropdown/yes_no/short_text have no meaningful
 * unselected default).
 *
 * Required questions are deliberately never seeded: submit stays blocked
 * until the athlete actually answers each one, so e.g. an injury check-in
 * can't be skipped past on a prefilled "no" the athlete never read. */
function buildInitialAnswers(
  form: FormWithQuestions,
  lastResponse: Record<string, unknown> | null,
): Answers {
  const answers: Answers = {};
  for (const question of form.questions) {
    if (question.required) continue;
    const prior = priorAnswerValue(question, lastResponse?.[question.id]);
    const seeded =
      prior !== undefined ? prior : defaultAnswerForQuestion(question);
    if (seeded !== undefined) answers[question.id] = seeded;
  }
  return answers;
}

function QuestionListItem({
  index,
  question,
  answers,
  onAnswerChange,
}: {
  index: number;
  question: FormQuestionWithOptions;
  answers: Answers;
  onAnswerChange: (questionId: string, value: FormAnswerValue) => void;
}) {
  return (
    <View className="mb-6">
      <View className="mb-3 flex-row items-baseline gap-1.5">
        <Lead className="text-brand-orange">{index + 1}.</Lead>
        <RowTitle className="flex-1">{question.prompt}</RowTitle>
      </View>
      <FormQuestionField
        question={question}
        value={answers[question.id]}
        onChange={(value) => onAnswerChange(question.id, value)}
      />
    </View>
  );
}

function PreSessionFormBody({
  form,
  answers,
  onAnswerChange,
  submitting,
  onSubmit,
}: {
  form: FormWithQuestions;
  answers: Answers;
  onAnswerChange: (questionId: string, value: FormAnswerValue) => void;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const requiredMissing = form.questions.some((q) => {
    if (!q.required) return false;
    const a = answers[q.id];
    // Empty or whitespace-only text (typed then cleared) must still count as
    // unanswered, not just a literal undefined.
    return a == null || (typeof a === "string" && a.trim() === "");
  });

  return (
    <>
      <View className="px-5 pb-2">
        <H2 className="mb-1">Before you start</H2>
        <Caption>A few quick questions for your coach</Caption>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        className="px-5 pt-4">
        {form.questions.map((question, i) => (
          <QuestionListItem
            key={question.id}
            index={i}
            question={question}
            answers={answers}
            onAnswerChange={onAnswerChange}
          />
        ))}
      </ScrollView>
      <View className="border-border-subtle border-t px-5 pt-3 pb-8">
        <Button
          variant="primary"
          size="lg"
          disabled={requiredMissing || submitting}
          onPress={onSubmit}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            "Let's get to work."
          )}
        </Button>
      </View>
    </>
  );
}

/** Loads the program's check-in form plus the athlete's last response, or
 * redirects straight into the player when there's no form. Any failure
 * (offline, 5xx on either query) surfaces as `loadError` with a `retry` —
 * an unhandled rejection here would otherwise strand the athlete on the
 * spinner, unable to start the session. */
function usePreSessionForm(
  programId: string,
  sessionId: string,
  athleteProfileId: string | undefined,
) {
  const router = useRouter();
  const [form, setForm] = useState<FormWithQuestions | null | undefined>(
    undefined,
  );
  const [answers, setAnswers] = useState<Answers>({});
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!athleteProfileId || !sessionId || !programId) return;
    let cancelled = false;

    async function load() {
      try {
        const programForm = await getProgramForm(programId);
        if (cancelled) return;
        if (!programForm) {
          // No check-in form attached — start the session directly.
          await startOrResumeSession(sessionId, athleteProfileId!);
          if (cancelled) return;
          router.replace({
            pathname: "/(app)/training/play",
            params: { sessionId },
          });
          return;
        }
        const lastResponse = await getLastFormResponse(
          athleteProfileId!,
          programForm.id,
        );
        if (cancelled) return;
        setAnswers(buildInitialAnswers(programForm, lastResponse));
        setForm(programForm);
      } catch (e) {
        if (cancelled) return;
        console.warn("Failed to load pre-session form", e);
        setLoadError(true);
      }
    }

    setLoadError(false);
    load();
    return () => {
      cancelled = true;
    };
  }, [athleteProfileId, sessionId, programId, router, reloadKey]);

  return {
    form,
    answers,
    setAnswers,
    loadError,
    retry: () => setReloadKey((k) => k + 1),
  };
}

export default function PreSessionFormScreen() {
  const { sessionId, programId } = useLocalSearchParams<{
    sessionId: string;
    programId: string;
  }>();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { form, answers, setAnswers, loadError, retry } = usePreSessionForm(
    programId,
    sessionId,
    profile?.id,
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!profile || !form || submitting) return;
    setSubmitting(true);
    try {
      await submitPreSessionForm(sessionId, profile.id, form.id, answers);
      router.replace({
        pathname: "/(app)/training/play",
        params: { sessionId },
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="bg-surface flex-1">
      <ScreenHeader
        title=""
        backLabel="Session overview"
        onBack={() => router.back()}
      />
      {loadError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Lead className="mb-4 text-center">
            Couldn&apos;t load your check-in.
          </Lead>
          <Button variant="primary" size="md" onPress={retry}>
            Try again
          </Button>
        </View>
      ) : form === undefined ? (
        <ActivityIndicator
          color={colors.textTertiary}
          style={{ marginTop: 48 }}
        />
      ) : form === null ? null : (
        <PreSessionFormBody
          form={form}
          answers={answers}
          onAnswerChange={(questionId, value) =>
            setAnswers((prev) => ({ ...prev, [questionId]: value }))
          }
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      )}
    </View>
  );
}
