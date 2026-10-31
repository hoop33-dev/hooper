"use client";

import { cn } from "@/src/lib/cn";
import type { ExerciseRow, ExerciseStyleRow, UnitTypeRow } from "@hooper/db";
import { SetInlineSelect } from "./SetInlineSelect";
import { SetUnitTypeSelect } from "./SetUnitTypeSelect";
import { SetValueCell } from "./SetValueCell";
import type { SetConfigState } from "./setConfig";

type CreateUnitTypeAction = (input: {
  name: string;
  created_by: string;
}) => Promise<{ ok: boolean; data?: UnitTypeRow; error?: string }>;

function SetControls({
  controlsAlign,
  config,
  variantOptions,
  styles,
  unitTypes,
  createUnitTypeAction,
  profileId,
  onChangeUnitTypes,
  onChangeVariant,
  onChangeStyle,
}: {
  controlsAlign: "start" | "end";
  config: SetConfigState;
  variantOptions: ExerciseRow[];
  styles: ExerciseStyleRow[];
  unitTypes: UnitTypeRow[];
  createUnitTypeAction?: CreateUnitTypeAction;
  profileId: string;
  onChangeUnitTypes: (unitTypes: string[]) => void;
  onChangeVariant: (id: string) => void;
  onChangeStyle: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 items-center gap-1.5",
        controlsAlign === "end" ? "justify-end" : "justify-start",
      )}>
      <SetUnitTypeSelect
        unitTypes={unitTypes}
        selected={config.slots.map((s) => s.unit_type)}
        onChange={onChangeUnitTypes}
        createUnitTypeAction={createUnitTypeAction}
        profileId={profileId}
        className="w-44"
      />
      {variantOptions.length > 1 && (
        <SetInlineSelect
          options={variantOptions}
          value={config.variantId}
          onChange={onChangeVariant}
          noneLabel="No variant"
          allowNone={false}
          mutedValue={variantOptions[0]?.id}
          className="w-40"
        />
      )}
      <SetInlineSelect
        options={styles}
        value={config.styleId}
        onChange={onChangeStyle}
        noneLabel="No style"
        className="w-36"
      />
    </div>
  );
}

function SetValueGrid({
  index,
  config,
  onChangeValue,
  onToggleAthlete,
}: {
  index: number;
  config: SetConfigState;
  onChangeValue: (slotIndex: number, value: number) => void;
  onToggleAthlete: (slotIndex: number, athleteEntered: boolean) => void;
}) {
  if (config.slots.length === 0) return null;

  return (
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: `repeat(${config.slots.length}, minmax(0, 1fr))`,
      }}>
      {config.slots.map((slot, slotIndex) => (
        <SetValueCell
          key={`${slot.unit_type}-${slotIndex}`}
          label={slot.unit_type}
          value={slot.value}
          athleteEntered={slot.value_entered_by === "athlete"}
          onChangeValue={(v) => onChangeValue(slotIndex, v)}
          onToggleAthlete={(v) => onToggleAthlete(slotIndex, v)}
          dataSetIndex={index}
          dataSlotIndex={slotIndex}
        />
      ))}
    </div>
  );
}

/** One set/round's editable card: a number badge, its unit-type/variant/
 * style controls, and a value cell per chosen unit type — shared by the
 * single-exercise modal (one card per set, with a "Set N" label) and the
 * superset editor (one card per round, per exercise, no label — the round
 * number badge alone is enough context there). */
export function SetConfigCard({
  index,
  label,
  controlsAlign = "end",
  config,
  variantOptions,
  styles,
  unitTypes,
  createUnitTypeAction,
  profileId,
  onChangeUnitTypes,
  onChangeVariant,
  onChangeStyle,
  onChangeValue,
  onToggleAthlete,
}: {
  index: number;
  /** "Set N" — omitted for the superset editor's round cards, which show
   * only the round number badge before the controls. */
  label?: string;
  /** "end" (the default) hugs the controls to the right, leaving a gap
   * after `label` — matches the single-exercise modal. The superset editor
   * passes "start" so its unlabeled cards' controls sit right after the
   * round badge instead of floating to the far right. */
  controlsAlign?: "start" | "end";
  config: SetConfigState;
  variantOptions: ExerciseRow[];
  styles: ExerciseStyleRow[];
  unitTypes: UnitTypeRow[];
  createUnitTypeAction?: CreateUnitTypeAction;
  profileId: string;
  onChangeUnitTypes: (unitTypes: string[]) => void;
  onChangeVariant: (id: string) => void;
  onChangeStyle: (id: string) => void;
  onChangeValue: (slotIndex: number, value: number) => void;
  onToggleAthlete: (slotIndex: number, athleteEntered: boolean) => void;
}) {
  return (
    <div className="border-portal-border bg-portal-card flex flex-col gap-3 rounded-xl border p-3">
      <div className="flex items-center gap-2">
        <div className="bg-portal-orange/10 text-portal-orange flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-xs font-black">
          {index + 1}
        </div>
        {label && (
          <span className="text-portal-text1 flex-shrink-0 text-sm font-bold">
            {label}
          </span>
        )}
        <SetControls
          controlsAlign={controlsAlign}
          config={config}
          variantOptions={variantOptions}
          styles={styles}
          unitTypes={unitTypes}
          createUnitTypeAction={createUnitTypeAction}
          profileId={profileId}
          onChangeUnitTypes={onChangeUnitTypes}
          onChangeVariant={onChangeVariant}
          onChangeStyle={onChangeStyle}
        />
      </div>
      <SetValueGrid
        index={index}
        config={config}
        onChangeValue={onChangeValue}
        onToggleAthlete={onToggleAthlete}
      />
    </div>
  );
}
