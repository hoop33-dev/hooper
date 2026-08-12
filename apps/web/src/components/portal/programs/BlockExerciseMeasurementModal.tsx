"use client";

import { sortUnitTypes } from "@/src/constants/unitTypes";
import { resolveMostCommonId } from "@/src/lib/blockExerciseDisplay";
import { cn } from "@/src/lib/cn";
import { formatMeasurementSummary } from "@/src/lib/measurementFormat";
import type { LinkScope, MeasurementInput } from "@/src/services/block.service";
import type {
  BlockExerciseWithDetails,
  ExerciseRow,
  ExerciseStyleRow,
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
import { CountStepper } from "./measurementGrid/CountStepper";
import { SetConfigCard } from "./measurementGrid/SetConfigCard";
import { SetInlineSelect } from "./measurementGrid/SetInlineSelect";
import { SetUnitTypeSelect } from "./measurementGrid/SetUnitTypeSelect";
import { SimpleSetTable } from "./measurementGrid/SimpleSetTable";
import { useHideAdditionalInfo } from "./measurementGrid/useHideAdditionalInfo";
import {
  applyStyleToAll,
  applyUnitTypesToAll,
  applyVariantToAll,
  copySlotValueToAllBelow,
  initSetConfigs,
  resizeSetConfigs,
  toFlatMeasurements,
  toMeasurementInput,
  toSetStylesPayload,
  toSetVariantsPayload,
  updateSetStyle,
  updateSetUnitTypes,
  updateSetVariant,
  updateSlotValue,
  type SetConfigState,
} from "./measurementGrid/setConfig";

export type BlockExerciseUpdateData = {
  sets: number;
  notes?: string;
  measurements: MeasurementInput;
  /** The winning variant across every set (see resolveMostCommonId) —
   * becomes the placement's own new default; per-set entries in
   * `set_variants` that already match it need no override row. */
  exercise_id?: string;
  /** Null clears the placement's style back to "none". */
  style_id?: string | null;
  set_variants?: Record<number, string>;
  set_styles?: Record<number, string | null>;
  /** Pre-resolved (id -> object) versions of the two maps above, for
   * optimistic local-state patching only — the server save itself only
   * consumes the plain id maps. */
  resolvedSetVariants?: Record<number, ExerciseRow>;
  resolvedSetStyles?: Record<number, ExerciseStyleRow | null>;
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
  /** The placement's base exercise + all its siblings — always at least a
   * single-entry list containing the placement's own exercise. Powers the
   * variant selectors. */
  variantOptions: ExerciseRow[];
  styles: ExerciseStyleRow[];
}

function ModalHeader({
  name,
  hideAdditionalInfo,
  onToggleHideAdditionalInfo,
  onClose,
}: {
  name: string;
  hideAdditionalInfo: boolean;
  onToggleHideAdditionalInfo: (v: boolean) => void;
  onClose: () => void;
}) {
  return (
    <div className="border-portal-border flex flex-shrink-0 items-center justify-between gap-3 border-b px-4 py-3">
      <h2 className="font-title text-portal-text1 min-w-0 truncate text-[15px] font-extrabold tracking-wide">
        {name}
      </h2>
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

/** Bordered quick-set panel: picking a value in any of its three controls
 * immediately overwrites every set's corresponding field — the generalized,
 * always-visible sibling of the old single "apply variant to all" link.
 * The units control keeps its own local pending selection (since it's a
 * multi-pick, up to 3) and re-applies the whole combo on every toggle, so
 * picking "Shots" then "Makes" converges to Shots+Makes on every set rather
 * than each click reverting to a single unit type. */
function ApplyToAllSetsPanel({
  variantOptions,
  styles,
  onApplyUnitTypes,
  onApplyVariant,
  onApplyStyle,
}: {
  variantOptions: ExerciseRow[];
  styles: ExerciseStyleRow[];
  onApplyUnitTypes: (unitTypes: string[]) => void;
  onApplyVariant: (id: string) => void;
  onApplyStyle: (id: string) => void;
}) {
  const [pendingUnitTypes, setPendingUnitTypes] = useState<string[]>([]);

  return (
    <div className="border-portal-border bg-portal-bg flex flex-col gap-2 rounded-xl border p-3">
      <div className="text-portal-text2 flex items-center gap-1.5 text-xs font-bold">
        <DuplicateIcon size={12} />
        Apply to all sets
      </div>
      <div className="grid grid-cols-3 gap-2">
        <SetUnitTypeSelect
          selected={pendingUnitTypes}
          onChange={(unitTypes) => {
            setPendingUnitTypes(unitTypes);
            onApplyUnitTypes(unitTypes);
          }}
        />
        {variantOptions.length > 1 && (
          <SetInlineSelect
            options={variantOptions}
            value=""
            onChange={onApplyVariant}
            noneLabel="Variant"
            allowNone={false}
          />
        )}
        <SetInlineSelect
          options={styles}
          value=""
          onChange={onApplyStyle}
          noneLabel="Style"
        />
      </div>
    </div>
  );
}

interface ModalBodyProps {
  sets: number;
  onSets: (v: number) => void;
  configs: SetConfigState[];
  hideAdditionalInfo: boolean;
  onChangeUnitTypes: (setIndex: number, unitTypes: string[]) => void;
  onChangeVariant: (setIndex: number, id: string) => void;
  onChangeStyle: (setIndex: number, id: string) => void;
  onChangeValue: (setIndex: number, slotIndex: number, value: number) => void;
  onToggleAthlete: (
    setIndex: number,
    slotIndex: number,
    athleteEntered: boolean,
  ) => void;
  onApplyUnitTypesToAll: (unitTypes: string[]) => void;
  onApplyVariantToAll: (id: string) => void;
  onApplyStyleToAll: (id: string) => void;
  variantOptions: ExerciseRow[];
  styles: ExerciseStyleRow[];
}

function ModalBody({
  sets,
  onSets,
  configs,
  hideAdditionalInfo,
  onChangeUnitTypes,
  onChangeVariant,
  onChangeStyle,
  onChangeValue,
  onToggleAthlete,
  onApplyUnitTypesToAll,
  onApplyVariantToAll,
  onApplyStyleToAll,
  variantOptions,
  styles,
}: ModalBodyProps) {
  return (
    <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-4 py-4">
      <CountStepper label="Sets" value={sets} onChange={onSets} />
      {hideAdditionalInfo ? (
        <SimpleSetTable
          rowLabel={(setIndex) => `Set ${setIndex + 1}`}
          configs={configs}
          variantOptions={variantOptions}
          styles={styles}
          onChangeVariantAll={onApplyVariantToAll}
          onChangeStyleAll={onApplyStyleToAll}
          onChangeValue={onChangeValue}
          onToggleAthlete={onToggleAthlete}
        />
      ) : (
        <>
          <ApplyToAllSetsPanel
            variantOptions={variantOptions}
            styles={styles}
            onApplyUnitTypes={onApplyUnitTypesToAll}
            onApplyVariant={onApplyVariantToAll}
            onApplyStyle={onApplyStyleToAll}
          />
          <div className="flex flex-col gap-2">
            {configs.map((config, setIndex) => (
              <SetConfigCard
                key={setIndex}
                index={setIndex}
                label={`Set ${setIndex + 1}`}
                config={config}
                variantOptions={variantOptions}
                styles={styles}
                onChangeUnitTypes={(unitTypes) =>
                  onChangeUnitTypes(setIndex, unitTypes)
                }
                onChangeVariant={(id) => onChangeVariant(setIndex, id)}
                onChangeStyle={(id) => onChangeStyle(setIndex, id)}
                onChangeValue={(slotIndex, value) =>
                  onChangeValue(setIndex, slotIndex, value)
                }
                onToggleAthlete={(slotIndex, athleteEntered) =>
                  onToggleAthlete(setIndex, slotIndex, athleteEntered)
                }
              />
            ))}
          </div>
        </>
      )}
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
        data-role="save-button"
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

/** Footer or scope-choice footer, whichever the save flow currently needs —
 * extracted out of BlockExerciseMeasurementModal so the component itself
 * stays under the lint's max-lines-per-function limit. */
function ModalFooterArea({
  choosingScope,
  linkedWeeks,
  summary,
  onClose,
  onSaveClick,
  onChooseScope,
  onBackFromScope,
  saving,
}: {
  choosingScope: boolean;
  linkedWeeks?: number[];
  summary: string;
  onClose: () => void;
  onSaveClick: () => void;
  onChooseScope: (scope: LinkScope) => void;
  onBackFromScope: () => void;
  saving: boolean;
}) {
  if (choosingScope && linkedWeeks) {
    return (
      <ScopeChoiceFooter
        linkedWeeks={linkedWeeks}
        onChoose={onChooseScope}
        onBack={onBackFromScope}
        saving={saving}
      />
    );
  }
  return (
    <ModalFooter
      summary={summary}
      onClose={onClose}
      onSave={onSaveClick}
      saving={saving}
    />
  );
}

// Always show every unit type the exercise is currently configured with;
// fall back to whatever this placement already had if the exercise has
// since been reconfigured down to zero configured types.
export function resolveDefaultUnitTypes(
  blockExercise: BlockExerciseWithDetails,
): string[] {
  if (blockExercise.exercise.unitTypes.length > 0)
    return sortUnitTypes(blockExercise.exercise.unitTypes);
  const seen = new Set(blockExercise.measurements.map((m) => m.unit_type));
  if (seen.size > 0) return sortUnitTypes([...seen]);
  return ["Reps"];
}

function focusCell(root: HTMLElement, setIndex: number, slotIndex: number) {
  root
    .querySelector<HTMLElement>(
      `[data-role="set-value"][data-set-index="${setIndex}"][data-slot-index="${slotIndex}"]`,
    )
    ?.focus();
}

/** Keeps whichever set's row just received focus centered in the scrolling
 * body — covers both Enter (handleGridKeyDown's own focusCell calls) and
 * native Tab, since focus (unlike click) bubbles as a plain DOM event
 * React can listen for on the container, regardless of what moved it. */
function handleGridFocus(e: ReactFocusEvent<HTMLDivElement>) {
  const target = e.target as HTMLElement;
  if (target.dataset.role !== "set-value") return;
  target.scrollIntoView({ block: "center", behavior: "smooth" });
}

/** Excel-style set-grid navigation, position-based: Tab already moves
 * horizontally across a set's own slots (DOM order, with the "A" badge
 * excluded via tabIndex=-1); Enter here moves vertically to the next set's
 * slot at the same index (mechanically, regardless of whether that slot
 * happens to be the same unit type), or focuses Save on the last set.
 * Shift+Enter copies the focused cell's value down to every set below it
 * (see copySlotValueToAllBelow), then moves the cursor to the last set. */
function handleGridKeyDown(
  e: ReactKeyboardEvent<HTMLDivElement>,
  sets: number,
  copyToAllBelow: (setIndex: number, slotIndex: number) => void,
) {
  const target = e.target as HTMLElement;
  if (target.dataset.role !== "set-value") return;
  const setIndex = Number(target.dataset.setIndex);
  const slotIndex = Number(target.dataset.slotIndex);
  if (Number.isNaN(setIndex) || Number.isNaN(slotIndex)) return;
  if (e.key !== "Enter") return;
  e.preventDefault();

  const root = e.currentTarget;
  if (e.shiftKey) {
    copyToAllBelow(setIndex, slotIndex);
    focusCell(root, sets - 1, slotIndex);
    return;
  }
  if (setIndex < sets - 1) {
    focusCell(root, setIndex + 1, slotIndex);
  } else {
    root.querySelector<HTMLElement>('[data-role="save-button"]')?.focus();
  }
}

/** Resolves the live header name from in-progress edit state, mirroring
 * blockExerciseDisplay.ts's resolveDisplayName but against the modal's own
 * unsaved `configs` instead of a saved BlockExerciseWithDetails — same
 * "most common, tie → first, no suffix when the placement's own base
 * exercise wins" rule. */
function resolveLiveHeaderName(
  configs: SetConfigState[],
  baseExerciseId: string,
  baseExerciseName: string,
  variantOptions: ExerciseRow[],
): string {
  const overrides = Object.fromEntries(configs.map((c, i) => [i, c.variantId]));
  const { winnerId, nonMatchingCount } = resolveMostCommonId(
    baseExerciseId,
    overrides,
    configs.length,
  );
  if (winnerId === baseExerciseId) return baseExerciseName;
  const winnerName =
    variantOptions.find((v) => v.id === winnerId)?.name ?? baseExerciseName;
  return nonMatchingCount > 0
    ? `${winnerName} +${nonMatchingCount}`
    : winnerName;
}

/** Builds the server save payload plus its optimistic-patch counterparts —
 * the placement's own new `exercise_id`/`style_id` are recomputed as
 * whichever variant/style is now most common across the sets (same rule as
 * the header name and the style pill), so the fewest possible per-set
 * override rows are needed and reopening the modal later reproduces the
 * exact same resolved name/pill. */
function toSavePayload(
  blockExercise: BlockExerciseWithDetails,
  sets: number,
  configs: SetConfigState[],
  variantOptions: ExerciseRow[],
  styles: ExerciseStyleRow[],
): BlockExerciseUpdateData {
  const variantOverrides = toSetVariantsPayload(configs);
  const { winnerId: exerciseId } = resolveMostCommonId(
    blockExercise.exercise_id,
    variantOverrides,
    sets,
  );

  const styleOverridesForResolve = Object.fromEntries(
    configs.map((c, i) => [i, c.styleId]),
  );
  const { winnerId: styleWinner } = resolveMostCommonId(
    blockExercise.style_id ?? "",
    styleOverridesForResolve,
    sets,
  );
  const styleId = styleWinner || null;

  return {
    sets: Math.max(1, sets),
    measurements: toMeasurementInput(configs),
    exercise_id: exerciseId,
    style_id: styleId,
    set_variants: variantOverrides,
    set_styles: toSetStylesPayload(configs),
    resolvedSetVariants: Object.fromEntries(
      configs
        .map(
          (c, i) =>
            [i, variantOptions.find((v) => v.id === c.variantId)] as const,
        )
        .filter(
          (entry): entry is [number, ExerciseRow] => entry[1] !== undefined,
        ),
    ),
    resolvedSetStyles: Object.fromEntries(
      configs.map((c, i) => [
        i,
        styles.find((s) => s.id === c.styleId) ?? null,
      ]),
    ),
  };
}

/** Owns the placement's editable per-set state — extracted out of
 * BlockExerciseMeasurementModal so the component itself stays under the
 * lint's max-lines-per-function limit. Method names match the ModalBody
 * props they feed directly. */
function useSetConfigEditor(
  blockExercise: BlockExerciseWithDetails,
  defaultUnitTypes: string[],
) {
  const [sets, setSets] = useState(blockExercise.sets);
  const [configs, setConfigs] = useState<SetConfigState[]>(() =>
    initSetConfigs(blockExercise, defaultUnitTypes),
  );

  return {
    sets,
    configs,
    onSets: (next: number) => {
      setSets(next);
      setConfigs((prev) => resizeSetConfigs(prev, next));
    },
    onChangeUnitTypes: (setIndex: number, unitTypes: string[]) =>
      setConfigs((prev) => updateSetUnitTypes(prev, setIndex, unitTypes)),
    onChangeVariant: (setIndex: number, id: string) =>
      setConfigs((prev) => updateSetVariant(prev, setIndex, id)),
    onChangeStyle: (setIndex: number, id: string) =>
      setConfigs((prev) => updateSetStyle(prev, setIndex, id)),
    onChangeValue: (setIndex: number, slotIndex: number, value: number) =>
      setConfigs((prev) =>
        updateSlotValue(prev, setIndex, slotIndex, { value }),
      ),
    onToggleAthlete: (
      setIndex: number,
      slotIndex: number,
      athleteEntered: boolean,
    ) =>
      setConfigs((prev) =>
        updateSlotValue(prev, setIndex, slotIndex, {
          value_entered_by: athleteEntered ? "athlete" : "coach",
        }),
      ),
    onApplyUnitTypesToAll: (unitTypes: string[]) =>
      setConfigs((prev) => applyUnitTypesToAll(prev, unitTypes)),
    onApplyVariantToAll: (id: string) =>
      setConfigs((prev) => applyVariantToAll(prev, id)),
    onApplyStyleToAll: (id: string) =>
      setConfigs((prev) => applyStyleToAll(prev, id)),
    copyToAllBelow: (setIndex: number, slotIndex: number) =>
      setConfigs((prev) => copySlotValueToAllBelow(prev, setIndex, slotIndex)),
  };
}

export function BlockExerciseMeasurementModal({
  blockExercise,
  onClose,
  onSave,
  linkedWeeks,
  variantOptions,
  styles,
}: BlockExerciseMeasurementModalProps) {
  const { exercise } = blockExercise;
  const defaultUnitTypes = resolveDefaultUnitTypes(blockExercise);

  const editor = useSetConfigEditor(blockExercise, defaultUnitTypes);
  const [hideAdditionalInfo, setHideAdditionalInfo] = useHideAdditionalInfo();
  const [saving, setSaving] = useState(false);
  const [choosingScope, setChoosingScope] = useState(false);
  const onBackdropClick = useModalDismiss(onClose);

  const summary = formatMeasurementSummary({
    sets: editor.sets,
    measurements: toFlatMeasurements(editor.configs),
  });

  const headerName = resolveLiveHeaderName(
    editor.configs,
    blockExercise.exercise_id,
    exercise.name,
    variantOptions,
  );

  async function commit(scope?: LinkScope) {
    setSaving(true);
    await onSave(
      toSavePayload(
        blockExercise,
        editor.sets,
        editor.configs,
        variantOptions,
        styles,
      ),
      scope,
    );
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
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4",
      )}>
      <div
        onKeyDown={(e) =>
          handleGridKeyDown(e, editor.sets, editor.copyToAllBelow)
        }
        onFocus={handleGridFocus}
        className="bg-portal-card flex h-[640px] max-h-[90vh] w-full max-w-[650px] flex-col overflow-hidden rounded-2xl shadow-2xl">
        <ModalHeader
          name={headerName}
          hideAdditionalInfo={hideAdditionalInfo}
          onToggleHideAdditionalInfo={setHideAdditionalInfo}
          onClose={onClose}
        />
        <ModalBody
          sets={editor.sets}
          onSets={editor.onSets}
          configs={editor.configs}
          hideAdditionalInfo={hideAdditionalInfo}
          onChangeUnitTypes={editor.onChangeUnitTypes}
          onChangeVariant={editor.onChangeVariant}
          onChangeStyle={editor.onChangeStyle}
          onChangeValue={editor.onChangeValue}
          onToggleAthlete={editor.onToggleAthlete}
          onApplyUnitTypesToAll={editor.onApplyUnitTypesToAll}
          onApplyVariantToAll={editor.onApplyVariantToAll}
          onApplyStyleToAll={editor.onApplyStyleToAll}
          variantOptions={variantOptions}
          styles={styles}
        />
        <ModalFooterArea
          choosingScope={choosingScope}
          linkedWeeks={linkedWeeks}
          summary={summary}
          onClose={onClose}
          onSaveClick={handleSaveClick}
          onChooseScope={(scope) => void commit(scope)}
          onBackFromScope={() => setChoosingScope(false)}
          saving={saving}
        />
      </div>
    </div>
  );
}
