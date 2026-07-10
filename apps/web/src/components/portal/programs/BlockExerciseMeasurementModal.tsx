"use client";

import { cn } from "@/src/lib/cn";
import {
  convertUnit,
  defaultUnitFor,
  formatMeasurementSummary,
  unitOptionsFor,
} from "@/src/lib/measurementFormat";
import type { LinkScope } from "@/src/services/block.service";
import type { BlockExerciseWithDetails, EnteredBy } from "@hooper/db";
import { useEffect, useState } from "react";
import { PortalButton } from "../ui/PortalButton";
import { PortalTextarea } from "../ui/PortalInput";
import { DuplicateIcon, XIcon } from "../ui/icons";
import { useModalDismiss } from "../ui/useModalDismiss";

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

/** One set's value within a unit-type slot — a placement's `sets` count
 * determines how many of these each slot holds, so a pyramid/wave set can
 * carry a distinct value per set instead of one value applied uniformly. */
export type SetValueState = { value: number; value_entered_by: EnteredBy };

/** Each unit type is its own independent column (Reps, Weight, Time, RPE,
 * Distance, Shots, Makes, etc.) — a placement is whichever of these an
 * exercise is configured with, shown simultaneously, never bundled. Its
 * display unit is shared across every set (switching kg→lbs affects the
 * whole column, not one set). */
export type MeasurementState = {
  unit_type: string;
  value_unit: string | null;
  sets: SetValueState[];
};

export type BlockExerciseUpdateData = {
  sets: number;
  notes?: string;
  measurements: {
    unit_type: string;
    value_unit: string | null;
    sets: { value: number | null; value_entered_by: EnteredBy }[];
  }[];
};

interface BlockExerciseMeasurementModalProps {
  blockExercise: BlockExerciseWithDetails;
  onClose: () => void;
  onSave: (data: BlockExerciseUpdateData, scope?: LinkScope) => Promise<void>;
  /** Every week this placement is linked across, when it's linked to more
   * than just itself — enables the "apply to" scope choice on save,
   * Calendar-style, since target numbers often intentionally differ week to
   * week and don't fit a single always/never sync rule. */
  linkedWeeks?: number[];
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
        <XIcon />
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
      <span className="text-portal-text2 w-14 flex-shrink-0 text-xs font-bold">
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
 * the unit type offers more than one — e.g. kg/lbs/g. */
function UnitControl({
  unit,
  options,
  onChange,
}: {
  unit: string;
  options: string[] | null;
  onChange: (unit: string) => void;
}) {
  if (!unit) return null;
  if (options && options.length > 1) {
    return (
      <select
        value={unit}
        onChange={(e) => onChange(e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        className="text-portal-text3 border-none bg-transparent text-[10px] outline-none">
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }
  return <span className="text-portal-text3 text-[10px]">{unit}</span>;
}

/** Custom-drawn instead of relying on the native checkbox: browsers render
 * an unstyled unchecked `accent-color` checkbox as a solid black square, not
 * an empty box. Small enough to sit inside a single set's cell. */
function AthleteEnteredBadge({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      title={
        checked
          ? "Athlete enters this set — click to plan a number instead"
          : "Let the athlete enter this set"
      }
      className={cn(
        "absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full border text-[8px] font-black",
        checked
          ? "border-portal-orange bg-portal-orange text-white"
          : "border-portal-border bg-portal-card text-portal-text3",
      )}>
      A
    </button>
  );
}

/** One measurement column's header: unit-type label, its unit dropdown (if
 * it has one), and a "copy set 1 to every set" action — the fast path that
 * keeps a uniform placement a two-click job instead of typing the same
 * number into every row. */
export function MeasurementColumnHeader({
  measurement,
  onUnitChange,
  onCopyFirstToAll,
}: {
  measurement: MeasurementState;
  onUnitChange: (unit: string) => void;
  onCopyFirstToAll: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1">
        <span className="text-portal-text2 text-[10px] font-bold tracking-wide uppercase">
          {measurement.unit_type}
        </span>
        {measurement.sets.length > 1 && (
          <button
            type="button"
            onClick={onCopyFirstToAll}
            title="Copy set 1's value to every set"
            className="text-portal-text3 hover:text-portal-orange">
            <DuplicateIcon size={10} />
          </button>
        )}
      </div>
      <UnitControl
        unit={measurement.value_unit ?? ""}
        options={unitOptionsFor(measurement.unit_type)}
        onChange={onUnitChange}
      />
    </div>
  );
}

export function SetRow({
  setIndex,
  measurements,
  onChangeValue,
  onToggleAthlete,
}: {
  setIndex: number;
  measurements: MeasurementState[];
  onChangeValue: (measurementIndex: number, value: number) => void;
  onToggleAthlete: (measurementIndex: number, athleteEntered: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-portal-text3 w-14 flex-shrink-0 text-[11px] font-bold">
        Set {setIndex + 1}
      </span>
      <div
        className="grid flex-1 gap-2"
        style={{
          gridTemplateColumns: `repeat(${measurements.length}, minmax(0, 1fr))`,
        }}>
        {measurements.map((m, mi) => {
          const cell = m.sets[setIndex];
          const athleteEntered = cell.value_entered_by === "athlete";
          return (
            <div
              key={m.unit_type}
              className="border-portal-border bg-portal-card relative flex items-center justify-center rounded-lg border py-1.5">
              {athleteEntered ? (
                <span className="text-portal-text3 text-[11px] italic">
                  Athlete enters
                </span>
              ) : (
                <StepperInput
                  value={cell.value}
                  min={0}
                  onChange={(v) => onChangeValue(mi, v)}
                  className="font-title text-portal-orange w-full text-center text-base font-black"
                />
              )}
              <AthleteEnteredBadge
                checked={athleteEntered}
                onChange={(v) => onToggleAthlete(mi, v)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ModalBodyProps {
  sets: number;
  onSets: (v: number) => void;
  measurements: MeasurementState[];
  onChangeValue: (
    measurementIndex: number,
    setIndex: number,
    value: number,
  ) => void;
  onToggleAthlete: (
    measurementIndex: number,
    setIndex: number,
    athleteEntered: boolean,
  ) => void;
  onUnitChange: (measurementIndex: number, unit: string) => void;
  onCopyFirstToAll: (measurementIndex: number) => void;
  notes: string;
  onNotes: (v: string) => void;
}

function ModalBody({
  sets,
  onSets,
  measurements,
  onChangeValue,
  onToggleAthlete,
  onUnitChange,
  onCopyFirstToAll,
  notes,
  onNotes,
}: ModalBodyProps) {
  return (
    <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-4 py-4">
      <SetsField value={sets} onChange={onSets} />
      <div className="bg-portal-border h-px" />
      {measurements.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-14 flex-shrink-0" />
            <div
              className="grid flex-1 gap-2"
              style={{
                gridTemplateColumns: `repeat(${measurements.length}, minmax(0, 1fr))`,
              }}>
              {measurements.map((m, mi) => (
                <MeasurementColumnHeader
                  key={m.unit_type}
                  measurement={m}
                  onUnitChange={(unit) => onUnitChange(mi, unit)}
                  onCopyFirstToAll={() => onCopyFirstToAll(mi)}
                />
              ))}
            </div>
          </div>
          {Array.from({ length: sets }, (_, setIndex) => (
            <SetRow
              key={setIndex}
              setIndex={setIndex}
              measurements={measurements}
              onChangeValue={(mi, value) => onChangeValue(mi, setIndex, value)}
              onToggleAthlete={(mi, athleteEntered) =>
                onToggleAthlete(mi, setIndex, athleteEntered)
              }
            />
          ))}
        </div>
      )}
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

/** Shown instead of the normal footer once "Save" is clicked on a linked
 * placement — mirrors a calendar app's this-event/this-and-following/
 * all-events choice for editing a recurring event. */
function ScopeChoiceFooter({
  linkedWeeks,
  onChoose,
  onBack,
  saving,
}: {
  linkedWeeks: number[];
  onChoose: (scope: LinkScope) => void;
  onBack: () => void;
  saving: boolean;
}) {
  return (
    <div className="border-portal-border bg-portal-bg flex flex-shrink-0 flex-col gap-2 border-t px-4 py-3">
      <span className="text-portal-text2 text-xs font-semibold">
        Linked across weeks {linkedWeeks.join(", ")} — apply this change to:
      </span>
      <div className="flex flex-col gap-1.5">
        <PortalButton
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => onChoose("this")}
          disabled={saving}>
          Just this week
        </PortalButton>
        <PortalButton
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => onChoose("future")}
          disabled={saving}>
          This and future weeks
        </PortalButton>
        <PortalButton
          variant="primary"
          size="sm"
          className="w-full"
          onClick={() => onChoose("all")}
          disabled={saving}>
          All {linkedWeeks.length} linked weeks
        </PortalButton>
      </div>
      <PortalButton
        variant="ghost"
        size="sm"
        onClick={onBack}
        disabled={saving}>
        Back
      </PortalButton>
    </div>
  );
}

// Always show every unit type the exercise is currently configured with;
// fall back to whatever this placement already had if the exercise has
// since been reconfigured down to zero configured types.
export function resolveUnitTypes(
  blockExercise: BlockExerciseWithDetails,
): string[] {
  if (blockExercise.exercise.unitTypes.length > 0)
    return blockExercise.exercise.unitTypes;
  const seen = new Set(blockExercise.measurements.map((m) => m.unit_type));
  if (seen.size > 0) return [...seen];
  return ["Reps"];
}

/** Builds `sets` per-set values for one unit type from whatever this
 * placement already had — padding by repeating the last known set's value
 * (rather than resetting to a default) when the placement's own row count
 * doesn't match `sets` yet (e.g. this modal just grew the stepper). */
function resolveSetValues(
  blockExercise: BlockExerciseWithDetails,
  unitType: string,
  setsCount: number,
): SetValueState[] {
  const rows = blockExercise.measurements
    .filter((m) => m.unit_type === unitType)
    .sort((a, b) => a.set_index - b.set_index);
  const last = rows[rows.length - 1];
  return Array.from({ length: setsCount }, (_, i) => {
    const row = rows[i] ?? last;
    return {
      value: row?.value ?? defaultValueFor(unitType),
      value_entered_by: row?.value_entered_by ?? "coach",
    };
  });
}

/** Mirrors block.service.ts's defaultValueFor: Reps-like unit types default
 * to a nonzero starting count; everything else starts at zero. */
function defaultValueFor(unitType: string): number {
  return unitType === "Reps" || unitType === "Reps Each Side" ? 8 : 0;
}

export function initMeasurements(
  unitTypes: string[],
  blockExercise: BlockExerciseWithDetails,
  setsCount: number,
): MeasurementState[] {
  return unitTypes.map((unitType) => {
    const existing = blockExercise.measurements.find(
      (m) => m.unit_type === unitType,
    );
    return {
      unit_type: unitType,
      value_unit: existing?.value_unit ?? defaultUnitFor(unitType),
      sets: resolveSetValues(blockExercise, unitType, setsCount),
    };
  });
}

/** Pads (repeating the last set's value) or truncates every measurement's
 * per-set values to a new sets count — the modal-local sibling of
 * block.service.ts's resizeMeasurements, kept in sync with the Sets
 * stepper as the coach adjusts it before saving. */
export function resizeMeasurementSets(
  measurements: MeasurementState[],
  setsCount: number,
): MeasurementState[] {
  return measurements.map((m) => {
    const last = m.sets[m.sets.length - 1];
    return {
      ...m,
      sets: Array.from({ length: setsCount }, (_, i) => m.sets[i] ?? last),
    };
  });
}

/** Pure per-set-array edits, factored out so both the single-exercise editor
 * (useMeasurementSetEditor) and the superset editor's per-exercise map
 * (SupersetRoundsModal) can share the same update logic. */
export function withCellPatch(
  measurements: MeasurementState[],
  measurementIndex: number,
  setIndex: number,
  patch: Partial<SetValueState>,
): MeasurementState[] {
  return measurements.map((m, mi) =>
    mi === measurementIndex
      ? {
          ...m,
          sets: m.sets.map((s, si) =>
            si === setIndex ? { ...s, ...patch } : s,
          ),
        }
      : m,
  );
}

export function withUnitChange(
  measurements: MeasurementState[],
  measurementIndex: number,
  newUnit: string,
): MeasurementState[] {
  return measurements.map((m, mi) => {
    if (mi !== measurementIndex) return m;
    const fromUnit = m.value_unit ?? newUnit;
    return {
      ...m,
      value_unit: newUnit,
      sets: m.sets.map((s) => ({
        ...s,
        value: convertUnit(s.value, fromUnit, newUnit, m.unit_type),
      })),
    };
  });
}

export function withFirstCopiedToAll(
  measurements: MeasurementState[],
  measurementIndex: number,
): MeasurementState[] {
  return measurements.map((m, mi) =>
    mi === measurementIndex
      ? { ...m, sets: m.sets.map(() => ({ ...m.sets[0] })) }
      : m,
  );
}

/** Owns one placement's editable measurement state — extracted out of
 * BlockExerciseMeasurementModal so the component itself stays under the
 * lint's max-lines-per-function limit. */
export function useMeasurementSetEditor(initializer: () => MeasurementState[]) {
  const [measurements, setMeasurements] =
    useState<MeasurementState[]>(initializer);

  return {
    measurements,
    setMeasurements,
    updateCell: (
      measurementIndex: number,
      setIndex: number,
      patch: Partial<SetValueState>,
    ) =>
      setMeasurements((prev) =>
        withCellPatch(prev, measurementIndex, setIndex, patch),
      ),
    updateUnit: (measurementIndex: number, newUnit: string) =>
      setMeasurements((prev) =>
        withUnitChange(prev, measurementIndex, newUnit),
      ),
    copyFirstToAll: (measurementIndex: number) =>
      setMeasurements((prev) => withFirstCopiedToAll(prev, measurementIndex)),
    resize: (setsCount: number) =>
      setMeasurements((prev) => resizeMeasurementSets(prev, setsCount)),
  };
}

/** Blanks out fields the athlete hasn't entered yet, for display purposes. */
function toSummaryMeasurements(measurements: MeasurementState[]) {
  return measurements.flatMap((m) =>
    m.sets.map((s, set_index) => ({
      unit_type: m.unit_type,
      set_index,
      value: s.value_entered_by === "athlete" ? null : s.value,
      value_entered_by: s.value_entered_by,
      value_unit: m.value_unit,
    })),
  );
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
      value_unit: m.value_unit,
      sets: m.sets.map((s) => ({
        value: s.value_entered_by === "athlete" ? null : Math.max(0, s.value),
        value_entered_by: s.value_entered_by,
      })),
    })),
  };
}

export function BlockExerciseMeasurementModal({
  blockExercise,
  onClose,
  onSave,
  linkedWeeks,
}: BlockExerciseMeasurementModalProps) {
  const { exercise } = blockExercise;
  const unitTypes = resolveUnitTypes(blockExercise);

  const [sets, setSets] = useState(blockExercise.sets);
  const editor = useMeasurementSetEditor(() =>
    initMeasurements(unitTypes, blockExercise, blockExercise.sets),
  );
  const [notes, setNotes] = useState(blockExercise.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [choosingScope, setChoosingScope] = useState(false);
  const onBackdropClick = useModalDismiss(onClose);

  function updateSets(next: number) {
    setSets(next);
    editor.resize(next);
  }

  const summary = formatMeasurementSummary({
    sets,
    measurements: toSummaryMeasurements(editor.measurements),
  });

  async function commit(scope?: LinkScope) {
    setSaving(true);
    await onSave(toSavePayload(sets, notes, editor.measurements), scope);
    setSaving(false);
  }

  function handleSaveClick() {
    if (linkedWeeks && linkedWeeks.length > 1) {
      setChoosingScope(true);
      return;
    }
    void commit();
  }

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="bg-portal-card flex max-h-[560px] w-full max-w-sm flex-col overflow-hidden rounded-2xl shadow-2xl">
        <ModalHeader name={exercise.name} onClose={onClose} />
        <ModalBody
          sets={sets}
          onSets={updateSets}
          measurements={editor.measurements}
          onChangeValue={(mi, si, value) =>
            editor.updateCell(mi, si, { value })
          }
          onToggleAthlete={(mi, si, athleteEntered) =>
            editor.updateCell(mi, si, {
              value_entered_by: athleteEntered ? "athlete" : "coach",
            })
          }
          onUnitChange={editor.updateUnit}
          onCopyFirstToAll={editor.copyFirstToAll}
          notes={notes}
          onNotes={setNotes}
        />
        {choosingScope && linkedWeeks ? (
          <ScopeChoiceFooter
            linkedWeeks={linkedWeeks}
            onChoose={(scope) => void commit(scope)}
            onBack={() => setChoosingScope(false)}
            saving={saving}
          />
        ) : (
          <ModalFooter
            summary={summary}
            onClose={onClose}
            onSave={handleSaveClick}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}
