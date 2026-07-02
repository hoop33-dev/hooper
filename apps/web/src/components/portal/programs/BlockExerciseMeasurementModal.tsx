"use client";

import { cn } from "@/src/lib/cn";
import {
  formatMeasurementSummary,
  measurementInputMode,
  weightUnitLabel,
  type MeasurementInputMode,
} from "@/src/lib/measurementFormat";
import type { BlockExerciseWithDetails } from "@hooper/db";
import { useEffect, useState } from "react";
import { PortalButton } from "../ui/PortalButton";
import { PortalTextarea } from "../ui/PortalInput";

/**
 * Number entry that allows the field to be blank while typing and coerces to
 * `min` on blur, with the native up/down spinner arrows hidden.
 */
function StepperInput({
  value,
  min,
  onChange,
  className,
}: {
  value: number;
  min: number;
  onChange: (v: number) => void;
  className: string;
}) {
  const [text, setText] = useState(String(value));
  // Keep the field in sync when value changes elsewhere (e.g. +/- buttons).
  useEffect(() => setText(String(value)), [value]);

  return (
    <input
      type="number"
      inputMode="decimal"
      min={min}
      value={text}
      onChange={(e) => {
        const next = e.target.value;
        setText(next);
        if (next === "") return; // allow transient blank while typing
        const parsed = Number(next);
        if (!Number.isNaN(parsed)) onChange(parsed);
      }}
      onBlur={() => {
        const parsed = Number(text);
        const resolved =
          text === "" || Number.isNaN(parsed) ? min : Math.max(min, parsed);
        onChange(resolved);
        setText(String(resolved));
      }}
      className={cn(
        "[appearance:textfield] outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        className,
      )}
    />
  );
}

export type BlockExerciseUpdateData = {
  unit_type: string;
  sets: number;
  reps?: number;
  value?: number;
  notes?: string;
};

interface BlockExerciseMeasurementModalProps {
  blockExercise: BlockExerciseWithDetails;
  onClose: () => void;
  onSave: (data: BlockExerciseUpdateData) => Promise<void>;
}

function ModalHeader({ name, onClose }: { name: string; onClose: () => void }) {
  return (
    <div className="border-portal-border flex flex-shrink-0 items-center justify-between border-b px-4 py-3">
      <h2 className="font-title text-portal-text1 text-[15px] font-extrabold tracking-wide">
        {name}
      </h2>
      <button
        type="button"
        onClick={onClose}
        className="border-portal-border text-portal-text2 flex h-7 w-7 items-center justify-center rounded-full border">
        ×
      </button>
    </div>
  );
}

function UnitTypeSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-portal-text2 mb-1.5 block text-xs font-semibold">
        Measured as
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-portal-border bg-portal-card text-portal-text1 h-9 w-full rounded-lg border px-2.5 text-sm">
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function SetsField({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-portal-text2 w-12 flex-shrink-0 text-xs font-bold">
        Sets
      </span>
      <div className="flex flex-1 items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, value - 1))}
          className="border-portal-border bg-portal-bg text-portal-text2 h-7 w-7 flex-shrink-0 rounded-lg border">
          −
        </button>
        <StepperInput
          value={value}
          min={1}
          onChange={onChange}
          className="font-title text-portal-text1 w-full flex-1 rounded-lg text-center text-lg font-black"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="border-portal-border bg-portal-bg text-portal-text2 h-7 w-7 flex-shrink-0 rounded-lg border">
          +
        </button>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-portal-text2 w-12 flex-shrink-0 text-xs font-bold">
        {label}
      </span>
      <div className="flex flex-1 items-center gap-2">
        <button
          type="button"
          onClick={() =>
            onChange(Math.max(0, Math.round((value - step) * 100) / 100))
          }
          className="border-portal-border bg-portal-bg text-portal-text2 h-7 w-7 flex-shrink-0 rounded-lg border">
          −
        </button>
        <div className="border-portal-border bg-portal-card flex flex-1 items-center justify-center gap-1 rounded-lg border py-1">
          <StepperInput
            value={value}
            min={0}
            onChange={onChange}
            className="font-title text-portal-orange w-full min-w-0 text-center text-base font-black"
          />
          {suffix && (
            <span className="text-portal-text3 flex-shrink-0 text-[11px]">
              {suffix}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.round((value + step) * 100) / 100)}
          className="border-portal-border bg-portal-bg text-portal-text2 h-7 w-7 flex-shrink-0 rounded-lg border">
          +
        </button>
      </div>
    </div>
  );
}

interface MeasurementFieldsProps {
  mode: MeasurementInputMode;
  unitType: string;
  reps: number;
  onReps: (v: number) => void;
  value: number;
  onValue: (v: number) => void;
}

function MeasurementFields({
  mode,
  unitType,
  reps,
  onReps,
  value,
  onValue,
}: MeasurementFieldsProps) {
  if (mode === "duration") {
    const suffix = unitType === "Time" ? "sec" : "m";
    return (
      <NumberField
        label="Duration"
        value={value}
        step={5}
        suffix={suffix}
        onChange={onValue}
      />
    );
  }
  return (
    <>
      <NumberField
        label="Reps"
        value={reps}
        step={1}
        suffix=""
        onChange={onReps}
      />
      {mode === "reps-weight" && (
        <NumberField
          label="Load"
          value={value}
          step={2.5}
          suffix={weightUnitLabel(unitType)}
          onChange={onValue}
        />
      )}
      {mode === "reps-percent" && (
        <NumberField
          label="% 1RM"
          value={value}
          step={5}
          suffix="%"
          onChange={onValue}
        />
      )}
    </>
  );
}

interface ModalBodyProps {
  unitTypeOptions: string[];
  unitType: string;
  onUnitType: (v: string) => void;
  sets: number;
  onSets: (v: number) => void;
  mode: MeasurementInputMode;
  reps: number;
  onReps: (v: number) => void;
  value: number;
  onValue: (v: number) => void;
  notes: string;
  onNotes: (v: string) => void;
}

function ModalBody({
  unitTypeOptions,
  unitType,
  onUnitType,
  sets,
  onSets,
  mode,
  reps,
  onReps,
  value,
  onValue,
  notes,
  onNotes,
}: ModalBodyProps) {
  return (
    <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-4 py-4">
      {unitTypeOptions.length > 1 && (
        <UnitTypeSelect
          options={unitTypeOptions}
          value={unitType}
          onChange={onUnitType}
        />
      )}
      <SetsField value={sets} onChange={onSets} />
      <div className="bg-portal-border h-px" />
      <MeasurementFields
        mode={mode}
        unitType={unitType}
        reps={reps}
        onReps={onReps}
        value={value}
        onValue={onValue}
      />
      <div className="bg-portal-border h-px" />
      <PortalTextarea
        label="Note"
        value={notes}
        onChange={(e) => onNotes(e.target.value)}
        rows={3}
        placeholder="e.g. Keep back flat, focus on range of motion…"
      />
    </div>
  );
}

function ModalFooter({
  summary,
  onClose,
  onSave,
  saving,
}: {
  summary: string;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="border-portal-border bg-portal-bg flex flex-shrink-0 items-center gap-2 border-t px-4 py-3">
      <span className="text-portal-text1 flex-1 truncate text-sm font-bold">
        {summary}
      </span>
      <PortalButton
        variant="ghost"
        size="sm"
        onClick={onClose}
        disabled={saving}>
        Cancel
      </PortalButton>
      <PortalButton
        variant="primary"
        size="sm"
        onClick={onSave}
        disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </PortalButton>
    </div>
  );
}

export function BlockExerciseMeasurementModal({
  blockExercise,
  onClose,
  onSave,
}: BlockExerciseMeasurementModalProps) {
  const { exercise } = blockExercise;
  const unitTypeOptions =
    exercise.unitTypes.length > 0
      ? exercise.unitTypes
      : [blockExercise.unit_type];
  const [unitType, setUnitType] = useState(blockExercise.unit_type);
  const [sets, setSets] = useState(blockExercise.sets);
  const [reps, setReps] = useState(blockExercise.reps ?? 8);
  const [value, setValue] = useState(blockExercise.value ?? 0);
  const [notes, setNotes] = useState(blockExercise.notes ?? "");
  const [saving, setSaving] = useState(false);

  const mode = measurementInputMode(unitType);
  const summary = formatMeasurementSummary({
    sets,
    unit_type: unitType,
    reps: mode === "duration" ? null : reps,
    value: mode === "reps-only" ? null : value,
  });

  async function handleSave() {
    setSaving(true);
    await onSave({
      unit_type: unitType,
      sets: Math.max(1, sets),
      reps: mode === "duration" ? undefined : Math.max(0, reps),
      value: mode === "reps-only" ? undefined : Math.max(0, value),
      notes: notes.trim() || undefined,
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="bg-portal-card flex max-h-[560px] w-full max-w-sm flex-col overflow-hidden rounded-2xl shadow-2xl">
        <ModalHeader name={exercise.name} onClose={onClose} />
        <ModalBody
          unitTypeOptions={unitTypeOptions}
          unitType={unitType}
          onUnitType={setUnitType}
          sets={sets}
          onSets={setSets}
          mode={mode}
          reps={reps}
          onReps={setReps}
          value={value}
          onValue={setValue}
          notes={notes}
          onNotes={setNotes}
        />
        <ModalFooter
          summary={summary}
          onClose={onClose}
          onSave={handleSave}
          saving={saving}
        />
      </div>
    </div>
  );
}
