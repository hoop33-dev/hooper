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

/** Seeds the answer state so a question counts as already answered — and
 * gets submitted as-is if the athlete never touches it — whenever it has
 * something sensible to start from: their own last response (all types but
 * short_text) falling back to the field's cosmetic default (number/slider
 * only; dropdown/yes_no/short_text have no meaningful unselected default). */
function buildInitialAnswers(
  form: FormWithQuestions,
  lastResponse: Record<string, unknown> | null,
): Answers {
  const answers: Answers = {};
  for (const question of form.questions) {
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
  const requiredMissing = form.questions.some(
    (q) => q.required && answers[q.id] === undefined,
  );

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

export default function PreSessionFormScreen() {
  const { sessionId, programId } = useLocalSearchParams<{
    sessionId: string;
    programId: string;
  }>();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const [form, setForm] = useState<FormWithQuestions | null | undefined>(
    undefined,
  );
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile || !sessionId || !programId) return;
    let cancelled = false;

    async function go() {
      const programForm = await getProgramForm(programId);
      if (cancelled) return;
      if (!programForm) {
        // No check-in form attached — start the session directly.
        await startOrResumeSession(sessionId, profile!.id);
        router.replace({
          pathname: "/(app)/training/play",
          params: { sessionId },
        });
        return;
      }
      const lastResponse = await getLastFormResponse(
        profile!.id,
        programForm.id,
      );
      if (cancelled) return;
      setAnswers(buildInitialAnswers(programForm, lastResponse));
      setForm(programForm);
    }
    go();
    return () => {
      cancelled = true;
    };
  }, [profile, sessionId, programId, router]);

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
      {form === undefined ? (
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
