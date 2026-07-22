"use client";

import { cn } from "@/src/lib/cn";
import type { FormQuestionType } from "@hooper/db";
import { QUESTION_TYPES } from "./questionTypes";

interface QuestionTypeSelectorProps {
  selected: FormQuestionType;
  onChange: (type: FormQuestionType) => void;
}

/** Single-select pill row for a question's answer type — same visual
 * language as UnitTypeSelector, but exactly one type is ever selected. */
export function QuestionTypeSelector({
  selected,
  onChange,
}: QuestionTypeSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-portal-text2 text-xs font-semibold">Answer type</p>
      <div className="flex flex-wrap gap-2">
        {QUESTION_TYPES.map(({ value, label }) => {
          const isSelected = value === selected;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                isSelected
                  ? "bg-portal-orange text-white"
                  : "border-portal-border bg-portal-card text-portal-text2 hover:border-portal-orange hover:text-portal-orange border",
              )}>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
