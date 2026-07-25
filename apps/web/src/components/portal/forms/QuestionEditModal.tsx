"use client";

import { cn } from "@/src/lib/cn";
import type { UpdateFormQuestionInput } from "@/src/services/form.service";
import type { FormQuestionWithOptions } from "@hooper/db";
import { InlineConfirmBar } from "../ui/InlineConfirmBar";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput, PortalTextarea } from "../ui/PortalInput";
import { XIcon } from "../ui/icons";
import { useModalDismiss } from "../ui/useModalDismiss";
import { QuestionTypeSelector } from "./QuestionTypeSelector";
import { useQuestionEditForm } from "./useQuestionEditForm";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 5;

interface QuestionEditModalProps {
  question: FormQuestionWithOptions;
  onClose: () => void;
  onSave: (data: UpdateFormQuestionInput) => Promise<void>;
  onDelete: () => Promise<void>;
}

type QuestionEditForm = ReturnType<typeof useQuestionEditForm>;

function RequiredToggle({
  required,
  onChange,
}: {
  required: boolean;
  onChange: (required: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-portal-text2 text-xs font-semibold">Answer</p>
      <div className="border-portal-border bg-portal-bg flex w-fit gap-0.5 rounded-lg border p-0.5">
        {[
          { value: true, label: "Required" },
          { value: false, label: "Optional" },
        ].map(({ value, label }) => (
          <button
            key={label}
            type="button"
            onClick={() => onChange(value)}
            className={cn(
              "rounded-md px-3.5 py-1 text-xs font-semibold transition",
              required === value
                ? "border-portal-border bg-portal-card text-portal-text1 border"
                : "text-portal-text3",
            )}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RangeFields({
  minValue,
  maxValue,
  onMinValue,
  onMaxValue,
}: {
  minValue: string;
  maxValue: string;
  onMinValue: (v: string) => void;
  onMaxValue: (v: string) => void;
}) {
  return (
    <div className="flex gap-3">
      <PortalInput
        label="Min (optional)"
        type="number"
        value={minValue}
        onChange={(e) => onMinValue(e.target.value)}
        wrapperClassName="flex-1"
      />
      <PortalInput
        label="Max (optional)"
        type="number"
        value={maxValue}
        onChange={(e) => onMaxValue(e.target.value)}
        wrapperClassName="flex-1"
      />
    </div>
  );
}

function OptionsFields({
  options,
  onChange,
}: {
  options: string[];
  onChange: (options: string[]) => void;
}) {
  function updateOption(index: number, value: string) {
    onChange(options.map((o, i) => (i === index ? value : o)));
  }
  function removeOption(index: number) {
    onChange(options.filter((_, i) => i !== index));
  }
  function addOption() {
    if (options.length >= MAX_OPTIONS) return;
    onChange([...options, ""]);
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-portal-text2 text-xs font-semibold">
        Options{" "}
        <span className="text-portal-text3 font-normal">
          ({MIN_OPTIONS}-{MAX_OPTIONS})
        </span>
      </p>
      {options.map((option, i) => (
        <div key={i} className="flex items-center gap-2">
          <PortalInput
            value={option}
            onChange={(e) => updateOption(i, e.target.value)}
            placeholder={`Option ${i + 1}`}
            wrapperClassName="flex-1"
          />
          <button
            type="button"
            onClick={() => removeOption(i)}
            disabled={options.length <= MIN_OPTIONS}
            className="text-portal-text3 hover:text-portal-text1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg disabled:cursor-not-allowed disabled:opacity-30">
            <XIcon />
          </button>
        </div>
      ))}
      {options.length < MAX_OPTIONS && (
        <button
          type="button"
          onClick={addOption}
          className="text-portal-orange w-fit text-xs font-semibold">
          + Add option
        </button>
      )}
    </div>
  );
}

function QuestionEditFields({
  form,
  onDelete,
}: {
  form: QuestionEditForm;
  onDelete: () => Promise<void>;
}) {
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
      <PortalTextarea
        label="Question"
        value={form.prompt}
        onChange={(e) => form.setPrompt(e.target.value)}
        placeholder="e.g. How many hours did you sleep last night?"
        rows={2}
        autoFocus
      />
      <QuestionTypeSelector selected={form.type} onChange={form.onTypeChange} />
      {(form.type === "number" || form.type === "slider") && (
        <RangeFields
          minValue={form.minValue}
          maxValue={form.maxValue}
          onMinValue={form.setMinValue}
          onMaxValue={form.setMaxValue}
        />
      )}
      {form.type === "dropdown" && (
        <OptionsFields options={form.options} onChange={form.setOptions} />
      )}
      <RequiredToggle required={form.required} onChange={form.setRequired} />

      <div className="border-portal-border mt-1 border-t pt-4">
        <div className="text-portal-text3 mb-2.5 text-[10px] font-bold tracking-wider uppercase">
          Danger zone
        </div>
        <InlineConfirmBar
          idleLabel="Delete this question"
          confirmLabel="Delete this question?"
          onConfirm={onDelete}
        />
      </div>
    </div>
  );
}

export function QuestionEditModal({
  question,
  onClose,
  onSave,
  onDelete,
}: QuestionEditModalProps) {
  const form = useQuestionEditForm(question, onSave);
  const onBackdropClick = useModalDismiss(onClose);

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-portal-card flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl shadow-2xl">
        <div className="border-portal-border flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-title text-portal-text1 text-lg font-extrabold tracking-wide">
            Edit question
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-portal-text3 hover:bg-portal-bg hover:text-portal-text1 flex h-8 w-8 items-center justify-center rounded-lg">
            <XIcon size={16} />
          </button>
        </div>

        <QuestionEditFields form={form} onDelete={onDelete} />

        <div className="border-portal-border flex justify-end gap-2 border-t px-6 py-4">
          <PortalButton
            variant="ghost"
            onClick={onClose}
            disabled={form.saving}>
            Cancel
          </PortalButton>
          <PortalButton
            variant="primary"
            onClick={form.handleSave}
            disabled={form.saving || !form.isValid}>
            {form.saving ? "Saving…" : "Save question"}
          </PortalButton>
        </div>
      </div>
    </div>
  );
}
