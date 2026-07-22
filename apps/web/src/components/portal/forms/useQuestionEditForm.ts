import type { UpdateFormQuestionInput } from "@/src/services/form.service";
import type { FormQuestionType, FormQuestionWithOptions } from "@hooper/db";
import { useState } from "react";

const MIN_OPTIONS = 2;

/** Owns a QuestionEditModal's field state, dropdown-option validity, and
 * the save request shape, so the modal component itself only renders. */
export function useQuestionEditForm(
  question: FormQuestionWithOptions,
  onSave: (data: UpdateFormQuestionInput) => Promise<void>,
) {
  const [prompt, setPrompt] = useState(question.prompt);
  const [type, setType] = useState<FormQuestionType>(question.type);
  const [required, setRequired] = useState(question.required);
  const [minValue, setMinValue] = useState(
    question.min_value !== null ? String(question.min_value) : "",
  );
  const [maxValue, setMaxValue] = useState(
    question.max_value !== null ? String(question.max_value) : "",
  );
  const [options, setOptions] = useState(
    question.options.length > 0
      ? question.options.map((o) => o.label)
      : ["", ""],
  );
  const [saving, setSaving] = useState(false);

  function onTypeChange(next: FormQuestionType) {
    setType(next);
    if (next === "slider" && minValue === "" && maxValue === "") {
      setMinValue("1");
      setMaxValue("10");
    }
  }

  const trimmedOptions = options.map((o) => o.trim());
  const isValid =
    prompt.trim().length > 0 &&
    (type !== "dropdown" ||
      trimmedOptions.filter((o) => o.length > 0).length >= MIN_OPTIONS);

  async function handleSave() {
    if (!isValid || saving) return;
    setSaving(true);
    await onSave({
      prompt: prompt.trim(),
      type,
      required,
      min_value: minValue.trim() === "" ? null : Number(minValue),
      max_value: maxValue.trim() === "" ? null : Number(maxValue),
      options: type === "dropdown" ? trimmedOptions.filter(Boolean) : [],
    });
    setSaving(false);
  }

  return {
    prompt,
    setPrompt,
    type,
    onTypeChange,
    required,
    setRequired,
    minValue,
    setMinValue,
    maxValue,
    setMaxValue,
    options,
    setOptions,
    saving,
    isValid,
    handleSave,
  };
}
