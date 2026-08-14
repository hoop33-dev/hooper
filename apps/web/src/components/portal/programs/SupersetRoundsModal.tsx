"use client";

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
import { ToggleSwitch } from "../ui/ToggleSwitch";
import { useModalDismiss } from "../ui/useModalDismiss";
import {
  resolveDefaultUnitTypes,
  type BlockExerciseUpdateData,
} from "./BlockExerciseMeasurementModal";
import { CountStepper } from "./measurementGrid/CountStepper";
import { SetConfigCard } from "./measurementGrid/SetConfigCard";
import {
  applyFirstRoundToAll,
  applyStyleToAll,
  applyVariantToAll,
  copySlotValueToAllBelow,
  initSetConfigs,
  resizeSetConfigs,
  toMeasurementInput,
  toVariantStylePayload,
  updateSetStyle,
  updateSetUnitTypes,
  updateSetVariant,
  updateSlotValue,
  type SetConfigState,
} from "./measurementGrid/setConfig";
import { SimpleSetTable } from "./measurementGrid/SimpleSetTable";
import { useHideAdditionalInfo } from "./measurementGrid/useHideAdditionalInfo";
import { variantOptionsFor } from "./variantOptions";

/** Editing a superset's shared rounds: every exercise in the block shares
 * the same round count (also editable here, via the Rounds stepper — it
 * cascades to every exercise's own round count and per-round measurements
 * on save), so this edits every exercise's per-round unit types/variant/
 * style/values together in one modal instead of bouncing between one
 * BlockExerciseMeasurementModal per exercise to keep rounds in sync. Each
 * exercise gets its own section (round cards, same layout as the
 * single-exercise modal's set cards) with its own "Apply to all rounds"
 * button, which copies round 1's setup onto every other round. */
/** One superset exercise's save payload — measurements plus the same
 * variant/style resolution (`toVariantStylePayload`) the single-exercise
 * modal sends, so per-round variant/style edits made here persist too. */
export type SupersetExercisePayload = { id: string } & Omit<
  BlockExerciseUpdateData,
  "sets" | "notes"
>;

interface SupersetRoundsModalProps {
  block: BlockWithExercises;
  exercises: ExerciseWithDetails[];
  styles: ExerciseStyleRow[];
  onClose: () => void;
  onSave: (
    rounds: number,
    perExercise: SupersetExercisePayload[],
  ) => Promise<void>;
}

function focusRound(root: HTMLElement, roundIndex: number, slotIndex: number) {
  root
    .querySelector<HTMLElement>(
      `[data-role="set-value"][data-set-index="${roundIndex}"][data-slot-index="${slotIndex}"]`,
    )
    ?.focus();
}

/** Excel-style round-grid navigation for one exercise section, mirroring
 * BlockExerciseMeasurementModal's handleGridKeyDown. */
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
  if (e.shiftKey) {
    onCopyToAllBelow(roundIndex, slotIndex);
    focusRound(root, rounds - 1, slotIndex);
    return;
  }
  if (roundIndex < rounds - 1) {
    focusRound(root, roundIndex + 1, slotIndex);
  } else if (isLast) {
    document.querySelector<HTMLElement>('[data-role="save-button"]')?.focus();
  }
}

/** Keeps whichever round's row just received focus centered in the
 * modal's scrolling body — covers both Enter and native Tab, since focus
 * bubbles as a plain DOM event regardless of what moved it. */
function handleRoundFocus(e: ReactFocusEvent<HTMLDivElement>) {
  const target = e.target as HTMLElement;
  if (target.dataset.role !== "set-value") return;
  target.scrollIntoView({ block: "center", behavior: "smooth" });
}

function ExerciseSection({
  name,
  configs,
  rounds,
  variantOptions,
  styles,
  isLast,
  hideAdditionalInfo,
  onChangeUnitTypes,
  onChangeVariant,
  onChangeStyle,
  onChangeValue,
  onToggleAthlete,
  onApplyToAll,
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
  hideAdditionalInfo: boolean;
  onChangeUnitTypes: (roundIndex: number, unitTypes: string[]) => void;
  onChangeVariant: (roundIndex: number, id: string) => void;
  onChangeStyle: (roundIndex: number, id: string) => void;
  onChangeValue: (roundIndex: number, slotIndex: number, value: number) => void;
  onToggleAthlete: (
    roundIndex: number,
    slotIndex: number,
    athleteEntered: boolean,
  ) => void;
  /** Copies round 1's units/variant/style onto every other round. */
  onApplyToAll: () => void;
  onApplyVariantToAll: (id: string) => void;
  onApplyStyleToAll: (id: string) => void;
  onCopyToAllBelow: (roundIndex: number, slotIndex: number) => void;
}) {
  return (
    <div
      className="border-portal-border bg-portal-bg flex flex-col gap-3 rounded-xl border p-3"
      onKeyDown={(e) => handleRoundKeyDown(e, rounds, isLast, onCopyToAllBelow)}
      onFocus={handleRoundFocus}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-portal-text1 text-sm font-bold">{name}</span>
        {!hideAdditionalInfo && (
          <button
            type="button"
            onClick={onApplyToAll}
            title="Copy round 1's units, variant, and style to every round"
            className="border-portal-border bg-portal-card text-portal-orange flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap">
            <DuplicateIcon size={11} />
            Apply to all rounds
          </button>
        )}
      </div>
      {hideAdditionalInfo ? (
        <SimpleSetTable
          rowLabel={(roundIndex) => `Rd ${roundIndex + 1}`}
          configs={configs}
          variantOptions={variantOptions}
          styles={styles}
          onChangeVariantAll={onApplyVariantToAll}
          onChangeStyleAll={onApplyStyleToAll}
          onChangeValue={onChangeValue}
          onToggleAthlete={onToggleAthlete}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {configs.map((config, roundIndex) => (
            <SetConfigCard
              key={roundIndex}
              index={roundIndex}
              controlsAlign="start"
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
      )}
    </div>
  );
}

function ModalHeader({
  name,
  rounds,
  hideAdditionalInfo,
  onToggleHideAdditionalInfo,
  onClose,
}: {
  name: string;
  rounds: number;
  hideAdditionalInfo: boolean;
  onToggleHideAdditionalInfo: (v: boolean) => void;
  onClose: () => void;
}) {
  return (
    <div className="border-portal-border flex flex-shrink-0 items-center justify-between gap-3 border-b px-4 py-3">
      <div className="min-w-0">
        <h2 className="font-title text-portal-text1 truncate text-[15px] font-extrabold tracking-wide">
          {name}
        </h2>
        <p className="text-portal-text3 text-[11px]">
          Superset — {rounds} shared round{rounds === 1 ? "" : "s"}
        </p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-3">
        <ToggleSwitch
          label="Hide additional info"
          checked={hideAdditionalInfo}
          onChange={onToggleHideAdditionalInfo}
        />
        <button
          type="button"
          onClick={onClose}
          className="border-portal-border text-portal-text2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border">
          <XIcon />
        </button>
      </div>
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
  hideAdditionalInfo,
  edit,
}: {
  blockExercise: BlockExerciseWithDetails;
  configs: SetConfigState[];
  rounds: number;
  exercises: ExerciseWithDetails[];
  styles: ExerciseStyleRow[];
  isLast: boolean;
  hideAdditionalInfo: boolean;
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
      hideAdditionalInfo={hideAdditionalInfo}
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
      onApplyToAll={() => edit(id, applyFirstRoundToAll)}
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

/** One exercise's full save payload — measurements plus the variant/style
 * resolution `toVariantStylePayload` computes, mirroring the single-exercise
 * modal's own save payload so a per-round variant/style edit persists. */
function toSupersetExercisePayload(
  blockExercise: BlockExerciseWithDetails,
  configs: SetConfigState[],
  rounds: number,
  exercises: ExerciseWithDetails[],
  styles: ExerciseStyleRow[],
): SupersetExercisePayload {
  return {
    id: blockExercise.id,
    measurements: toMeasurementInput(configs),
    ...toVariantStylePayload(
      blockExercise.exercise_id,
      blockExercise.style_id,
      rounds,
      configs,
      variantOptionsFor(blockExercise.exercise, exercises),
      styles,
    ),
  };
}

export function SupersetRoundsModal({
  block,
  exercises,
  styles,
  onClose,
  onSave,
}: SupersetRoundsModalProps) {
  const [rounds, setRounds] = useState(block.sets ?? 1);
  const [byExercise, setByExercise] = useState<Record<string, SetConfigState[]>>(
    () =>
      Object.fromEntries(
        block.exercises.map((be) => [
          be.id,
          initSetConfigs(be, resolveDefaultUnitTypes(be)),
        ]),
      ),
  );
  const [hideAdditionalInfo, setHideAdditionalInfo] = useHideAdditionalInfo();
  const [saving, setSaving] = useState(false);
  const onBackdropClick = useModalDismiss(onClose);

  function edit(
    exerciseId: string,
    fn: (configs: SetConfigState[]) => SetConfigState[],
  ) {
    setByExercise((prev) => ({ ...prev, [exerciseId]: fn(prev[exerciseId]!) }));
  }

  function updateRounds(next: number) {
    setRounds(next);
    setByExercise((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([id, configs]) => [
          id,
          resizeSetConfigs(configs, next),
        ]),
      ),
    );
  }

  async function handleSave() {
    setSaving(true);
    const perExercise = block.exercises.map((be) =>
      toSupersetExercisePayload(be, byExercise[be.id]!, rounds, exercises, styles),
    );
    await onSave(rounds, perExercise);
    setSaving(false);
  }

  const exerciseCount = block.exercises.length;

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="bg-portal-card flex h-[640px] max-h-[90vh] w-full max-w-[650px] flex-col overflow-hidden rounded-2xl shadow-2xl">
        <ModalHeader
          name={block.name}
          rounds={rounds}
          hideAdditionalInfo={hideAdditionalInfo}
          onToggleHideAdditionalInfo={setHideAdditionalInfo}
          onClose={onClose}
        />
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-1">
            <CountStepper label="Rounds" value={rounds} onChange={updateRounds} />
            <p className="text-portal-text3 text-[11px]">
              One round runs all {exerciseCount} exercise
              {exerciseCount === 1 ? "" : "s"} back-to-back before resting.
            </p>
          </div>
          <div className="bg-portal-border h-px" />
          <div className="flex flex-col gap-4">
            {block.exercises.map((be, index) => (
              <ExerciseSectionContainer
                key={be.id}
                blockExercise={be}
                configs={byExercise[be.id]!}
                rounds={rounds}
                exercises={exercises}
                styles={styles}
                isLast={index === exerciseCount - 1}
                hideAdditionalInfo={hideAdditionalInfo}
                edit={edit}
              />
            ))}
          </div>
        </div>
        <ModalFooter
          exerciseCount={exerciseCount}
          rounds={rounds}
          onClose={onClose}
          onSave={handleSave}
          saving={saving}
        />
      </div>
    </div>
  );
}
