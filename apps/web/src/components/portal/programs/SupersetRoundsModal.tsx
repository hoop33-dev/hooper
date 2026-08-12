"use client";

import type { MeasurementInput } from "@/src/services/block.service";
import type {
  BlockExerciseWithDetails,
  BlockWithExercises,
  ExerciseStyleRow,
  ExerciseWithDetails,
} from "@hooper/db";
import {
  useState,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { DuplicateIcon, XIcon } from "../ui/icons";
import { PortalButton } from "../ui/PortalButton";
import { useModalDismiss } from "../ui/useModalDismiss";
import { resolveDefaultUnitTypes } from "./BlockExerciseMeasurementModal";
import {
  applyStyleToAll,
  applyUnitTypesToAll,
  applyVariantToAll,
  copySlotValueToAllBelow,
  initSetConfigs,
  toMeasurementInput,
  updateSetStyle,
  updateSetUnitTypes,
  updateSetVariant,
  updateSlotValue,
  type SetConfigState,
} from "./measurementGrid/setConfig";
import { SetInlineSelect } from "./measurementGrid/SetInlineSelect";
import { SetUnitTypeSelect } from "./measurementGrid/SetUnitTypeSelect";
import { SetValueCell } from "./measurementGrid/SetValueCell";
import { variantOptionsFor } from "./variantOptions";

/** Editing a superset's shared rounds: every exercise in the block shares
 * the same round count (set on the block itself, see BlockCard's Superset
 * control), so this edits every exercise's per-round unit types/variant/
 * style/values together in one modal instead of bouncing between one
 * BlockExerciseMeasurementModal per exercise to keep rounds in sync. Each
 * exercise gets its own ROUND/UNITS/VARIANT/STYLE/VALUES table section,
 * with its own "Apply to all rounds" action — the same per-set editing
 * model as the single-exercise modal, just laid out per exercise instead
 * of as one placement's full-height cards. */
interface SupersetRoundsModalProps {
  block: BlockWithExercises;
  exercises: ExerciseWithDetails[];
  styles: ExerciseStyleRow[];
  onClose: () => void;
  onSave: (
    perExercise: { id: string; measurements: MeasurementInput }[],
  ) => Promise<void>;
}

function TableHeader() {
  return (
    <div className="text-portal-text3 grid grid-cols-[28px_1fr_1fr_1fr_1fr] gap-2 px-1 text-[9px] font-semibold tracking-wide uppercase">
      <span>Round</span>
      <span>Units</span>
      <span>Variant</span>
      <span>Style</span>
      <span>Values</span>
    </div>
  );
}

function RoundRow({
  roundIndex,
  config,
  variantOptions,
  styles,
  onChangeUnitTypes,
  onChangeVariant,
  onChangeStyle,
  onChangeValue,
  onToggleAthlete,
}: {
  roundIndex: number;
  config: SetConfigState;
  variantOptions: ReturnType<typeof variantOptionsFor>;
  styles: ExerciseStyleRow[];
  onChangeUnitTypes: (unitTypes: string[]) => void;
  onChangeVariant: (id: string) => void;
  onChangeStyle: (id: string) => void;
  onChangeValue: (slotIndex: number, value: number) => void;
  onToggleAthlete: (slotIndex: number, athleteEntered: boolean) => void;
}) {
  return (
    <div className="border-portal-border grid grid-cols-[28px_1fr_1fr_1fr_1fr] items-center gap-2 border-t px-1 py-2">
      <span className="text-portal-text1 text-sm font-bold">
        {roundIndex + 1}
      </span>
      <SetUnitTypeSelect
        selected={config.slots.map((s) => s.unit_type)}
        onChange={onChangeUnitTypes}
      />
      {variantOptions.length > 1 ? (
        <SetInlineSelect
          options={variantOptions}
          value={config.variantId}
          onChange={onChangeVariant}
          noneLabel="No variant"
          allowNone={false}
          mutedValue={variantOptions[0]?.id}
        />
      ) : (
        <span />
      )}
      <SetInlineSelect
        options={styles}
        value={config.styleId}
        onChange={onChangeStyle}
        noneLabel="No style"
      />
      <div className="flex flex-wrap gap-1.5">
        {config.slots.map((slot, slotIndex) => (
          <SetValueCell
            key={`${slot.unit_type}-${slotIndex}`}
            label={slot.unit_type}
            value={slot.value}
            athleteEntered={slot.value_entered_by === "athlete"}
            onChangeValue={(v) => onChangeValue(slotIndex, v)}
            onToggleAthlete={(v) => onToggleAthlete(slotIndex, v)}
            dataSetIndex={roundIndex}
            dataSlotIndex={slotIndex}
          />
        ))}
      </div>
    </div>
  );
}

/** Excel-style round-grid navigation for one exercise section, mirroring
 * BlockExerciseMeasurementModal's handleGridKeyDown — extracted to a plain
 * function (not a closure inside ExerciseSection) to keep that component
 * under the lint's max-lines-per-function limit. */
function handleRoundKeyDown(
  e: ReactKeyboardEvent<HTMLDivElement>,
  rounds: number,
  isLast: boolean,
  onCopyToAllBelow: (roundIndex: number, slotIndex: number) => void,
) {
  const target = e.target as HTMLElement;
  if (target.dataset.role !== "set-value") return;
  const roundIndex = Number(target.dataset.setIndex);
  const slotIndex = Number(target.dataset.slotIndex);
  if (Number.isNaN(roundIndex) || Number.isNaN(slotIndex)) return;
  if (e.key !== "Enter") return;
  e.preventDefault();

  const root = e.currentTarget;
  function focus(round: number) {
    root
      .querySelector<HTMLElement>(
        `[data-role="set-value"][data-set-index="${round}"][data-slot-index="${slotIndex}"]`,
      )
      ?.focus();
  }
  if (e.shiftKey) {
    onCopyToAllBelow(roundIndex, slotIndex);
    focus(rounds - 1);
    return;
  }
  if (roundIndex < rounds - 1) {
    focus(roundIndex + 1);
  } else if (isLast) {
    document.querySelector<HTMLElement>('[data-role="save-button"]')?.focus();
  }
}

/** Keeps whichever round's row just received focus centered in the
 * modal's scrolling body — covers both Enter (handleRoundKeyDown's own
 * focus calls) and native Tab, since focus bubbles as a plain DOM event
 * React can listen for on an ancestor, regardless of what moved it. */
function handleRoundFocus(e: ReactFocusEvent<HTMLDivElement>) {
  const target = e.target as HTMLElement;
  if (target.dataset.role !== "set-value") return;
  target.scrollIntoView({ block: "center", behavior: "smooth" });
}

/** The section header's right-hand "Apply to all rounds" controls —
 * extracted out of ExerciseSection so that component stays under the
 * lint's max-lines-per-function limit. See its own local pending-selection
 * comment for why the units control keeps transient state. */
function ApplyToAllRoundsControls({
  variantOptions,
  styles,
  onApplyUnitTypesToAll,
  onApplyVariantToAll,
  onApplyStyleToAll,
}: {
  variantOptions: ReturnType<typeof variantOptionsFor>;
  styles: ExerciseStyleRow[];
  onApplyUnitTypesToAll: (unitTypes: string[]) => void;
  onApplyVariantToAll: (id: string) => void;
  onApplyStyleToAll: (id: string) => void;
}) {
  // Local, incremental pending selection — re-applies the whole combo on
  // every toggle (see BlockExerciseMeasurementModal's ApplyToAllSetsPanel),
  // so picking "Shots" then "Makes" converges to Shots+Makes on every round
  // rather than each click reverting to a single unit type.
  const [pendingUnitTypes, setPendingUnitTypes] = useState<string[]>([]);

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-portal-orange flex flex-shrink-0 items-center gap-1 text-[10px] font-semibold whitespace-nowrap">
        <DuplicateIcon size={10} />
        Apply to all rounds
      </span>
      <SetUnitTypeSelect
        selected={pendingUnitTypes}
        onChange={(unitTypes) => {
          setPendingUnitTypes(unitTypes);
          onApplyUnitTypesToAll(unitTypes);
        }}
      />
      {variantOptions.length > 1 && (
        <SetInlineSelect
          options={variantOptions}
          value=""
          onChange={onApplyVariantToAll}
          noneLabel="Variant"
          allowNone={false}
          className="w-24"
        />
      )}
      <SetInlineSelect
        options={styles}
        value=""
        onChange={onApplyStyleToAll}
        noneLabel="Style"
        className="w-24"
      />
    </div>
  );
}

function ExerciseSection({
  name,
  configs,
  rounds,
  variantOptions,
  styles,
  isLast,
  onChangeUnitTypes,
  onChangeVariant,
  onChangeStyle,
  onChangeValue,
  onToggleAthlete,
  onApplyUnitTypesToAll,
  onApplyVariantToAll,
  onApplyStyleToAll,
  onCopyToAllBelow,
}: {
  name: string;
  configs: SetConfigState[];
  rounds: number;
  variantOptions: ReturnType<typeof variantOptionsFor>;
  styles: ExerciseStyleRow[];
  /** Whether this is the last exercise in the block — its last round's Enter
   * reaches all the way to the Save button, mirroring the single-exercise
   * modal. Earlier exercises just stop at their own last round rather than
   * jumping into the next exercise's (possibly differently-shaped) rows. */
  isLast: boolean;
  onChangeUnitTypes: (roundIndex: number, unitTypes: string[]) => void;
  onChangeVariant: (roundIndex: number, id: string) => void;
  onChangeStyle: (roundIndex: number, id: string) => void;
  onChangeValue: (roundIndex: number, slotIndex: number, value: number) => void;
  onToggleAthlete: (
    roundIndex: number,
    slotIndex: number,
    athleteEntered: boolean,
  ) => void;
  onApplyUnitTypesToAll: (unitTypes: string[]) => void;
  onApplyVariantToAll: (id: string) => void;
  onApplyStyleToAll: (id: string) => void;
  onCopyToAllBelow: (roundIndex: number, slotIndex: number) => void;
}) {
  return (
    <div
      className="flex flex-col gap-2"
      onKeyDown={(e) => handleRoundKeyDown(e, rounds, isLast, onCopyToAllBelow)}
      onFocus={handleRoundFocus}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-portal-text1 text-[13px] font-bold">{name}</span>
        <ApplyToAllRoundsControls
          variantOptions={variantOptions}
          styles={styles}
          onApplyUnitTypesToAll={onApplyUnitTypesToAll}
          onApplyVariantToAll={onApplyVariantToAll}
          onApplyStyleToAll={onApplyStyleToAll}
        />
      </div>
      <TableHeader />
      {configs.map((config, roundIndex) => (
        <RoundRow
          key={roundIndex}
          roundIndex={roundIndex}
          config={config}
          variantOptions={variantOptions}
          styles={styles}
          onChangeUnitTypes={(unitTypes) =>
            onChangeUnitTypes(roundIndex, unitTypes)
          }
          onChangeVariant={(id) => onChangeVariant(roundIndex, id)}
          onChangeStyle={(id) => onChangeStyle(roundIndex, id)}
          onChangeValue={(slotIndex, value) =>
            onChangeValue(roundIndex, slotIndex, value)
          }
          onToggleAthlete={(slotIndex, athleteEntered) =>
            onToggleAthlete(roundIndex, slotIndex, athleteEntered)
          }
        />
      ))}
    </div>
  );
}

function ModalHeader({
  name,
  rounds,
  onClose,
}: {
  name: string;
  rounds: number;
  onClose: () => void;
}) {
  return (
    <div className="border-portal-border flex flex-shrink-0 items-center justify-between border-b px-4 py-3">
      <div>
        <h2 className="font-title text-portal-text1 text-[15px] font-extrabold tracking-wide">
          {name}
        </h2>
        <p className="text-portal-text3 text-[11px]">
          Superset — {rounds} shared round{rounds === 1 ? "" : "s"}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="border-portal-border text-portal-text2 flex h-7 w-7 items-center justify-center rounded-full border">
        <XIcon />
      </button>
    </div>
  );
}

function ModalFooter({
  exerciseCount,
  rounds,
  onClose,
  onSave,
  saving,
}: {
  exerciseCount: number;
  rounds: number;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="border-portal-border bg-portal-bg flex flex-shrink-0 items-center gap-2 border-t px-4 py-3">
      <span className="text-portal-text1 flex-1 truncate text-sm font-bold">
        {exerciseCount} exercise{exerciseCount === 1 ? "" : "s"} · {rounds}{" "}
        shared round{rounds === 1 ? "" : "s"}
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
        data-role="save-button"
        onClick={onSave}
        disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </PortalButton>
    </div>
  );
}

/** One exercise's fully-wired ExerciseSection — extracted out of
 * SupersetRoundsModal so that component stays under the lint's
 * max-lines-per-function limit. All edits go through `edit`, which patches
 * just this exercise's entry in the shared byExercise map. */
function ExerciseSectionContainer({
  blockExercise,
  configs,
  rounds,
  exercises,
  styles,
  isLast,
  edit,
}: {
  blockExercise: BlockExerciseWithDetails;
  configs: SetConfigState[];
  rounds: number;
  exercises: ExerciseWithDetails[];
  styles: ExerciseStyleRow[];
  isLast: boolean;
  edit: (
    exerciseId: string,
    fn: (configs: SetConfigState[]) => SetConfigState[],
  ) => void;
}) {
  const id = blockExercise.id;
  const variantOptions = variantOptionsFor(blockExercise.exercise, exercises);

  return (
    <ExerciseSection
      name={blockExercise.exercise.name}
      configs={configs}
      rounds={rounds}
      variantOptions={variantOptions}
      styles={styles}
      isLast={isLast}
      onChangeUnitTypes={(roundIndex, unitTypes) =>
        edit(id, (c) => updateSetUnitTypes(c, roundIndex, unitTypes))
      }
      onChangeVariant={(roundIndex, variantId) =>
        edit(id, (c) => updateSetVariant(c, roundIndex, variantId))
      }
      onChangeStyle={(roundIndex, styleId) =>
        edit(id, (c) => updateSetStyle(c, roundIndex, styleId))
      }
      onChangeValue={(roundIndex, slotIndex, value) =>
        edit(id, (c) => updateSlotValue(c, roundIndex, slotIndex, { value }))
      }
      onToggleAthlete={(roundIndex, slotIndex, athleteEntered) =>
        edit(id, (c) =>
          updateSlotValue(c, roundIndex, slotIndex, {
            value_entered_by: athleteEntered ? "athlete" : "coach",
          }),
        )
      }
      onApplyUnitTypesToAll={(unitTypes) =>
        edit(id, (c) => applyUnitTypesToAll(c, unitTypes))
      }
      onApplyVariantToAll={(variantId) =>
        edit(id, (c) => applyVariantToAll(c, variantId))
      }
      onApplyStyleToAll={(styleId) =>
        edit(id, (c) => applyStyleToAll(c, styleId))
      }
      onCopyToAllBelow={(roundIndex, slotIndex) =>
        edit(id, (c) => copySlotValueToAllBelow(c, roundIndex, slotIndex))
      }
    />
  );
}

export function SupersetRoundsModal({
  block,
  exercises,
  styles,
  onClose,
  onSave,
}: SupersetRoundsModalProps) {
  const rounds = block.sets ?? 1;
  const [byExercise, setByExercise] = useState<
    Record<string, SetConfigState[]>
  >(() =>
    Object.fromEntries(
      block.exercises.map((be) => [
        be.id,
        initSetConfigs(be, resolveDefaultUnitTypes(be)),
      ]),
    ),
  );
  const [saving, setSaving] = useState(false);
  const onBackdropClick = useModalDismiss(onClose);

  function edit(
    exerciseId: string,
    fn: (configs: SetConfigState[]) => SetConfigState[],
  ) {
    setByExercise((prev) => ({ ...prev, [exerciseId]: fn(prev[exerciseId]!) }));
  }

  async function handleSave() {
    setSaving(true);
    await onSave(
      block.exercises.map((be) => ({
        id: be.id,
        measurements: toMeasurementInput(byExercise[be.id]!),
      })),
    );
    setSaving(false);
  }

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="bg-portal-card flex h-[640px] max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl shadow-2xl">
        <ModalHeader name={block.name} rounds={rounds} onClose={onClose} />
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
          {block.exercises.map((be, index) => (
            <ExerciseSectionContainer
              key={be.id}
              blockExercise={be}
              configs={byExercise[be.id]!}
              rounds={rounds}
              exercises={exercises}
              styles={styles}
              isLast={index === block.exercises.length - 1}
              edit={edit}
            />
          ))}
        </div>
        <ModalFooter
          exerciseCount={block.exercises.length}
          rounds={rounds}
          onClose={onClose}
          onSave={handleSave}
          saving={saving}
        />
      </div>
    </div>
  );
}
