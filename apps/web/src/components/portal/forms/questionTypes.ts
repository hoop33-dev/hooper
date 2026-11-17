import type { FormQuestionType } from "@hooper/db";

export const QUESTION_TYPES: { value: FormQuestionType; label: string }[] = [
  { value: "short_text", label: "Short text" },
  { value: "number", label: "Number" },
  { value: "slider", label: "Slider" },
  { value: "dropdown", label: "Dropdown" },
  { value: "yes_no", label: "Yes / No" },
];

export function questionTypeLabel(type: FormQuestionType): string {
  return QUESTION_TYPES.find((t) => t.value === type)?.label ?? type;
}
