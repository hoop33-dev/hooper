"use client";

import { cn } from "@/src/lib/cn";
import {
  convertUnit,
  defaultUnitFor,
  formatMeasurementSummary,
  unitOptionsFor,
} from "@/src/lib/measurementFormat";
import type { BlockExerciseWithDetails, EnteredBy } from "@hooper/db";
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

/** Each unit type is its own independent field (Reps, Weight, Time, RPE,
 * Distance, Shots, Makes, etc.) — a placement is whichever of these an
 * exercise is configured with, shown simultaneously, never bundled. */
type MeasurementState = {
  unit_type: string;
  value: number;
  value_entered_by: EnteredBy;
  value_unit: string | null;
};

export type BlockExerciseUpdateData = {
  sets: number;
  notes?: string;
  measurements: {
    unit_type: string;
    value: number | null;
    value_entered_by: EnteredBy;
    value_unit: string | null;
  }[];
};

interface BlockExerciseMeasurementModalProps {
  blockExercise: BlockExerciseWithDetails;
  onClose: () => void;
  onSave: (data: BlockExerciseUpdateData) => Promise<void>;
}

/** How much each +/- tap changes a unit type's value by. */
function stepFor(unitType: string): number {
  if (unitType === "Weight") return 2.5;
  if (unitType === "Distance" || unitType === "Time" || unitType === "% 1RM")
    return 5;
  return 1; // Reps, Reps Each Side, RPE, Shots, Makes
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
        <StepButton
          disabled={false}
          onClick={() => onChange(Math.max(1, value - 1))}>
          −
        </StepButton>
        <StepperInput
          value={value}
          min={1}
          onChange={onChange}
          className="font-title text-portal-text1 w-full flex-1 rounded-lg text-center text-lg font-black"
        />
        <StepButton disabled={false} onClick={() => onChange(value + 1)}>
          +
        </StepButton>
      </div>
    </div>
  );
}

function StepButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="border-portal-border bg-portal-bg text-portal-text2 h-7 w-7 flex-shrink-0 rounded-lg border disabled:opacity-30">
      {children}
    </button>
  );
}

/** A static label when there's one (or zero) unit, or a real dropdown when
 * the unit type offers more than one — e.g. kg/lbs/g. Absolutely positioned
 * relative to the box so it never affects the input's centering. */
function UnitControl({
  unit,
  options,
  hidden,
  onChange,
}: {
  unit: string;
  options: string[] | null;
  hidden: boolean;
  onChange: (unit: string) => void;
}) {
  if (!unit) return null;
  if (options && options.length > 1) {
    return (
      <select
        value={unit}
        onChange={(e) => onChange(e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        className="text-portal-text3 absolute left-1/2 ml-7 flex-shrink-0 border-none bg-transparent text-[11px] outline-none">
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }
  if (hidden) return null;
  return (
    <span className="text-portal-text3 absolute left-1/2 ml-7 flex-shrink-0 text-[11px]">
      {unit}
    </span>
  );
}

/** Custom-drawn instead of relying on the native checkbox: browsers render
 * an unstyled unchecked `accent-color` checkbox as a solid black square, not
 * an empty box. */
function AthleteEnteredToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="text-portal-text3 ml-[60px] flex items-center gap-1.5 text-[10px] font-semibold">
      <span className="relative inline-flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="border-portal-border checked:bg-portal-orange checked:border-portal-orange peer h-3.5 w-3.5 shrink-0 appearance-none rounded-sm border bg-white"
        />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute hidden h-2.5 w-2.5 peer-checked:block">
          <path d="M5 13l4 4L19 7" />
        </svg>
      </span>
      Athlete enters this
    </label>
  );
}

function NumberField({
  label,
  value,
  step,
  unit,
  unitOptions,
  athleteEntered,
  onChange,
  onUnitChange,
  onAthleteEnteredChange,
}: {
  label: string;
  value: number;
  step: number;
  unit: string;
  unitOptions: string[] | null;
  athleteEntered: boolean;
  onChange: (v: number) => void;
  onUnitChange: (unit: string) => void;
  onAthleteEnteredChange: (v: boolean) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-3">
        <span className="text-portal-text2 w-12 flex-shrink-0 text-xs font-bold">
          {label}
        </span>
        <div className="flex flex-1 items-center gap-2">
          <StepButton
            disabled={athleteEntered}
            onClick={() =>
              onChange(Math.max(0, Math.round((value - step) * 100) / 100))
            }>
            −
          </StepButton>
          {/* StepperInput has a fixed width and is always centered in the
              box regardless of whether a unit label/dropdown is present
              (positioned absolute, out of flow), so every field's digits
              line up. */}
          <div
            className="border-portal-border bg-portal-card relative flex flex-1 items-center justify-center rounded-lg border py-1"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}>
            {athleteEntered ? (
              <span className="text-portal-text3 text-[11px] italic">
                Athlete enters
              </span>
            ) : (
              <>
                <StepperInput
                  value={value}
                  min={0}
                  onChange={onChange}
                  className="font-title text-portal-orange w-14 flex-shrink-0 text-center text-base font-black"
                />
                <UnitControl
                  unit={unit}
                  options={unitOptions}
                  hidden={focused}
                  onChange={onUnitChange}
                />
              </>
            )}
          </div>
          <StepButton
            disabled={athleteEntered}
            onClick={() => onChange(Math.round((value + step) * 100) / 100)}>
            +
          </StepButton>
        </div>
      </div>
      <AthleteEnteredToggle
        checked={athleteEntered}
        onChange={onAthleteEnteredChange}
      />
    </div>
  );
}

interface ModalBodyProps {
  sets: number;
  onSets: (v: number) => void;
  measurements: MeasurementState[];
  onUpdateMeasurement: (
    index: number,
    patch: Partial<MeasurementState>,
  ) => void;
  notes: string;
  onNotes: (v: string) => void;
}

function ModalBody({
  sets,
  onSets,
  measurements,
  onUpdateMeasurement,
  notes,
  onNotes,
}: ModalBodyProps) {
  return (
    <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-4 py-4">
      <SetsField value={sets} onChange={onSets} />
      <div className="bg-portal-border h-px" />
      {measurements.map((m, i) => (
        <div key={m.unit_type} className="flex flex-col gap-2">
          <NumberField
            label={m.unit_type}
            value={m.value}
            step={stepFor(m.unit_type)}
            unit={m.value_unit ?? ""}
            unitOptions={unitOptionsFor(m.unit_type)}
            athleteEntered={m.value_entered_by === "athlete"}
            onChange={(v) => onUpdateMeasurement(i, { value: v })}
            onUnitChange={(newUnit) =>
              onUpdateMeasurement(i, {
                value_unit: newUnit,
                value: convertUnit(
                  m.value,
                  m.value_unit ?? newUnit,
                  newUnit,
                  m.unit_type,
                ),
              })
            }
            onAthleteEnteredChange={(v) =>
              onUpdateMeasurement(i, {
                value_entered_by: v ? "athlete" : "coach",
              })
            }
          />
          {i < measurements.length - 1 && (
            <div className="bg-portal-border h-px" />
          )}
        </div>
      ))}
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

// Always show every unit type the exercise is currently configured with;
// fall back to whatever this placement already had if the exercise has
// since been reconfigured down to zero configured types.
function resolveUnitTypes(blockExercise: BlockExerciseWithDetails): string[] {
  if (blockExercise.exercise.unitTypes.length > 0)
    return blockExercise.exercise.unitTypes;
  if (blockExercise.measurements.length > 0)
    return blockExercise.measurements.map((m) => m.unit_type);
  return ["Reps"];
}

function initMeasurements(
  unitTypes: string[],
  blockExercise: BlockExerciseWithDetails,
): MeasurementState[] {
  return unitTypes.map((unitType) => {
    const existing = blockExercise.measurements.find(
      (m) => m.unit_type === unitType,
    );
    return {
      unit_type: unitType,
      value: existing?.value ?? 0,
      value_entered_by: existing?.value_entered_by ?? "coach",
      value_unit: existing?.value_unit ?? defaultUnitFor(unitType),
    };
  });
}

/** Blanks out fields the athlete hasn't entered yet, for display purposes. */
function toSummaryMeasurements(measurements: MeasurementState[]) {
  return measurements.map((m) => ({
    unit_type: m.unit_type,
    value: m.value_entered_by === "athlete" ? null : m.value,
    value_entered_by: m.value_entered_by,
    value_unit: m.value_unit,
  }));
}

/** Coerces athlete-entered fields to null so a stale in-memory number never
 * gets persisted for them. */
function toSavePayload(
  sets: number,
  notes: string,
  measurements: MeasurementState[],
): BlockExerciseUpdateData {
  return {
    sets: Math.max(1, sets),
    notes: notes.trim() || undefined,
    measurements: measurements.map((m) => ({
      unit_type: m.unit_type,
      value: m.value_entered_by === "athlete" ? null : Math.max(0, m.value),
      value_entered_by: m.value_entered_by,
      value_unit: m.value_unit,
    })),
  };
}

export function BlockExerciseMeasurementModal({
  blockExercise,
  onClose,
  onSave,
}: BlockExerciseMeasurementModalProps) {
  const { exercise } = blockExercise;
  const unitTypes = resolveUnitTypes(blockExercise);

  const [sets, setSets] = useState(blockExercise.sets);
  const [measurements, setMeasurements] = useState<MeasurementState[]>(() =>
    initMeasurements(unitTypes, blockExercise),
  );
  const [notes, setNotes] = useState(blockExercise.notes ?? "");
  const [saving, setSaving] = useState(false);

  function updateMeasurement(index: number, patch: Partial<MeasurementState>) {
    setMeasurements((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    );
  }

  const summary = formatMeasurementSummary({
    sets,
    measurements: toSummaryMeasurements(measurements),
  });

  async function handleSave() {
    setSaving(true);
    await onSave(toSavePayload(sets, notes, measurements));
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="bg-portal-card flex max-h-[560px] w-full max-w-sm flex-col overflow-hidden rounded-2xl shadow-2xl">
        <ModalHeader name={exercise.name} onClose={onClose} />
        <ModalBody
          sets={sets}
          onSets={setSets}
          measurements={measurements}
          onUpdateMeasurement={updateMeasurement}
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
