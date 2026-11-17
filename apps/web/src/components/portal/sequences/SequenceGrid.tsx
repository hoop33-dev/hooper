"use client";

import { cn } from "@/src/lib/cn";
import { defaultUnitFor } from "@/src/lib/measurementFormat";
import type { ExerciseWithDetails } from "@hooper/db";
import {
  resolveStepPick,
  type ResolvedPick,
  type SequenceStepDraft,
} from "@hooper/shared";
import { useMemo, useRef, useState } from "react";
import { StepperInput } from "../programs/measurementGrid/SetValueCell";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  InheritIcon,
  PlusIcon,
  XIcon,
} from "../ui/icons";
import { draftUnitTypes, type EditorSequence } from "./sequenceDraft";
import {
  SequenceStepPicker,
  type SequenceExerciseLibrary,
} from "./SequenceStepPicker";
import type { SequenceEditorActions } from "./useSequenceEditor";

const ICON_BUTTON =
  "text-portal-text3 hover:text-portal-text1 hover:bg-portal-bg flex h-5 w-5 items-center justify-center rounded disabled:opacity-30 disabled:hover:bg-transparent";
const GHOST_BUTTON =
  "border-portal-border-mid text-portal-text2 hover:border-portal-orange hover:text-portal-orange flex items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-dashed text-xs font-semibold";

type CellState = "empty" | "defined" | "inherited" | "changed";

const CELL_CLASS: Record<CellState, string> = {
  empty: "border-portal-border-mid border-dashed",
  defined: "border-portal-border bg-white",
  inherited: "hover:bg-portal-bg border-transparent",
  changed: "border-portal-orange/40 bg-portal-orange-soft",
};

function cellState(resolved: ResolvedPick, setIndex: number): CellState {
  if (!resolved.exerciseId) return "empty";
  if (resolved.inherited) return "inherited";
  return setIndex > 0 ? "changed" : "defined";
}

function CellContent({
  state,
  name,
  from,
}: {
  state: CellState;
  name: string;
  from: number;
}) {
  if (state === "empty") {
    return (
      <span className="text-portal-text3 flex items-center gap-1 text-xs">
        <PlusIcon size={11} /> Choose
      </span>
    );
  }
  const inherited = state === "inherited";
  return (
    <>
      <span
        className={cn(
          "truncate text-[13px]",
          inherited ? "text-portal-text3" : "text-portal-text1 font-semibold",
        )}>
        {name}
      </span>
      {inherited && (
        <span className="text-portal-text3 flex items-center gap-1 text-[10px]">
          <InheritIcon size={10} /> Set {from + 1}
        </span>
      )}
      {state === "changed" && (
        <span className="text-portal-orange text-[10px] font-semibold tracking-wide">
          Changed
        </span>
      )}
    </>
  );
}

function SequenceCell({
  step,
  setIndex,
  exercisesById,
  library,
  actions,
}: {
  step: SequenceStepDraft;
  setIndex: number;
  exercisesById: Map<string, ExerciseWithDetails>;
  library: SequenceExerciseLibrary;
  actions: SequenceEditorActions;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const resolved = resolveStepPick(step, setIndex);
  const state = cellState(resolved, setIndex);
  const name = resolved.exerciseId
    ? (exercisesById.get(resolved.exerciseId)?.name ?? "Removed exercise")
    : "";
  const earlier = setIndex > 0 ? resolveStepPick(step, setIndex - 1) : null;

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      onClick={() => setOpen((o) => !o)}
      onKeyDown={(e) => {
        // Ignore keys bubbling up from the (portalled) picker's search box.
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen(true);
        }
      }}
      className={cn(
        "relative flex h-[52px] min-w-0 cursor-pointer flex-col justify-center gap-0.5 rounded-lg border-[1.5px] px-2.5 transition-colors",
        CELL_CLASS[state],
        open && "border-portal-orange! shadow-[0_0_0_3px_rgba(241,88,37,0.14)]",
      )}>
      <CellContent state={state} name={name} from={resolved.from} />
      {state === "changed" && (
        <button
          type="button"
          title="Reset to previous set"
          onClick={(e) => {
            e.stopPropagation();
            actions.clear(setIndex, step.id);
          }}
          className="text-portal-orange hover:bg-portal-orange/10 absolute top-1 right-1 flex h-[18px] w-[18px] items-center justify-center rounded">
          <XIcon size={9} />
        </button>
      )}
      {open && (
        <SequenceStepPicker
          anchorRef={ref}
          stepLabel={step.label}
          categoryId={step.category_id}
          setIndex={setIndex}
          currentExerciseId={resolved.exerciseId}
          inheritedFrom={
            state === "changed" && earlier?.exerciseId ? earlier.from : null
          }
          library={library}
          onPick={(id) => actions.pick(setIndex, step.id, id)}
          onReset={() => actions.clear(setIndex, step.id)}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function StepHeader({
  step,
  index,
  count,
  library,
  actions,
}: {
  step: SequenceStepDraft;
  index: number;
  count: number;
  library: SequenceExerciseLibrary;
  actions: SequenceEditorActions;
}) {
  // Top-level categories only: a step narrows the picker, so a broad
  // category ("Finishing") is what coaches reach for.
  const topCategories = library.categories.filter((c) => !c.parent_id);
  return (
    <div className="flex h-full min-w-0 items-center gap-2">
      <span className="font-title text-portal-orange w-4 shrink-0 text-center text-xl font-black">
        {index + 1}
      </span>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <input
          value={step.label}
          onChange={(e) =>
            actions.updateStep(step.id, { label: e.target.value })
          }
          aria-label={`Step ${index + 1} name`}
          className="text-portal-text1 w-full bg-transparent p-0 text-[13px] font-bold outline-none"
        />
        <select
          value={step.category_id ?? ""}
          onChange={(e) =>
            actions.updateStep(step.id, { category_id: e.target.value || null })
          }
          aria-label={`Step ${index + 1} category`}
          className={cn(
            "max-w-full cursor-pointer truncate rounded-full border px-2 py-0.5 text-[11px] font-semibold outline-none",
            step.category_id
              ? "border-portal-orange/40 bg-portal-orange-soft text-portal-orange"
              : "border-portal-border bg-portal-bg text-portal-text3",
          )}>
          <option value="">Any category</option>
          {topCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex shrink-0 flex-col">
        <button
          type="button"
          title="Move up"
          disabled={index === 0}
          onClick={() => actions.moveStep(step.id, -1)}
          className={cn(ICON_BUTTON, "h-[18px] rotate-90")}>
          <ChevronLeftIcon size={11} />
        </button>
        <button
          type="button"
          title="Move down"
          disabled={index === count - 1}
          onClick={() => actions.moveStep(step.id, 1)}
          className={cn(ICON_BUTTON, "h-[18px] rotate-90")}>
          <ChevronRightIcon size={11} />
        </button>
      </div>
      <button
        type="button"
        title="Remove step"
        disabled={count < 2}
        onClick={() => actions.removeStep(step.id)}
        className={ICON_BUTTON}>
        <XIcon size={10} />
      </button>
    </div>
  );
}

function SetHeader({
  setIndex,
  setCount,
  lockSets,
  actions,
}: {
  setIndex: number;
  setCount: number;
  lockSets: boolean;
  actions: SequenceEditorActions;
}) {
  return (
    <div className="flex h-full items-center justify-between gap-1">
      <span className="text-portal-text1 text-[11px] font-bold tracking-[0.1em] uppercase">
        {lockSets ? "Round" : "Set"} {setIndex + 1}
      </span>
      {!lockSets && (
        <span className="flex">
          <button
            type="button"
            title="Duplicate set"
            onClick={() => actions.duplicateSet(setIndex)}
            className={ICON_BUTTON}>
            <CopyIcon size={11} />
          </button>
          <button
            type="button"
            title="Remove set"
            disabled={setCount < 2}
            onClick={() => actions.removeSet(setIndex)}
            className={ICON_BUTTON}>
            <XIcon size={10} />
          </button>
        </span>
      )}
    </div>
  );
}

function ValueInput({
  value,
  unit,
  onChange,
}: {
  value: number | null | undefined;
  unit: string | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="border-portal-border flex h-[30px] items-center gap-1 rounded-md border bg-white px-2">
      <StepperInput
        value={value ?? 0}
        min={0}
        onChange={onChange}
        className="font-title text-portal-text1 w-full min-w-0 bg-transparent text-center text-base font-bold"
      />
      {unit && (
        <span className="text-portal-text3 shrink-0 text-[10px]">{unit}</span>
      )}
    </div>
  );
}

export function SequenceLegend() {
  return (
    <div className="text-portal-text3 flex flex-wrap items-center gap-4 text-[11px]">
      <span className="flex items-center gap-1.5">
        <span className="border-portal-border h-2.5 w-3.5 rounded-[3px] border-[1.5px] bg-white" />
        Set 1 defines the sequence
      </span>
      <span className="flex items-center gap-1.5">
        <span className="border-portal-border-mid h-2.5 w-3.5 rounded-[3px] border-[1.5px] border-dashed" />
        <InheritIcon size={10} /> Carried from an earlier set
      </span>
      <span className="flex items-center gap-1.5">
        <span className="border-portal-orange/40 bg-portal-orange-soft h-2.5 w-3.5 rounded-[3px] border-[1.5px]" />
        Changed this set
      </span>
    </div>
  );
}

/** One row per tracked unit, one input per set. */
function ValueRows({
  draft,
  actions,
  rowClass,
  columns,
}: {
  draft: EditorSequence;
  actions: SequenceEditorActions;
  rowClass: string;
  columns: string;
}) {
  return (
    <div className="border-portal-border bg-portal-bg flex flex-col gap-1.5 rounded-b-xl border-t py-2.5">
      {draftUnitTypes(draft).map((unitType, position) => (
        <div
          key={unitType}
          className={rowClass}
          style={{ gridTemplateColumns: columns }}>
          <span className="text-portal-text1 pl-6 text-xs font-bold">
            {unitType}
            {unitType === "Reps" && (
              <span className="text-portal-text3 font-normal">
                {" "}
                (full runs)
              </span>
            )}
          </span>
          {draft.sets.map((set, setIndex) => (
            <ValueInput
              key={setIndex}
              value={set.slots[position]?.value}
              unit={set.slots[position]?.value_unit ?? defaultUnitFor(unitType)}
              onChange={(v) => actions.setValue(setIndex, position, v)}
            />
          ))}
          <span />
        </div>
      ))}
    </div>
  );
}

/** Steps are rows, sets are columns, unit values sit underneath. */
export function SequenceGrid({
  draft,
  actions,
  library,
  lockSets = false,
  compact = false,
}: {
  draft: EditorSequence;
  actions: SequenceEditorActions;
  library: SequenceExerciseLibrary;
  lockSets?: boolean;
  compact?: boolean;
}) {
  const exercisesById = useMemo(
    () => new Map(library.exercises.map((e) => [e.id, e])),
    [library.exercises],
  );
  const columns = `${compact ? 190 : 220}px repeat(${draft.sets.length}, minmax(${compact ? 140 : 150}px, 1fr)) ${lockSets ? "0px" : "56px"}`;
  const row = "grid items-center gap-2 px-3.5";

  return (
    <div className="border-portal-border shrink-0 overflow-x-auto rounded-xl border bg-white">
      <div className="min-w-min">
        <div
          className={cn(
            row,
            "border-portal-border bg-portal-bg h-[42px] rounded-t-xl border-b",
          )}
          style={{ gridTemplateColumns: columns }}>
          <span className="text-portal-text3 text-[11px] font-semibold tracking-[0.1em] uppercase">
            Steps
          </span>
          {draft.sets.map((_, setIndex) => (
            <SetHeader
              key={setIndex}
              setIndex={setIndex}
              setCount={draft.sets.length}
              lockSets={lockSets}
              actions={actions}
            />
          ))}
          {!lockSets ? (
            <button
              type="button"
              onClick={actions.addSet}
              className={cn(GHOST_BUTTON, "h-7 text-[11px]")}>
              <PlusIcon size={11} /> Set
            </button>
          ) : (
            <span />
          )}
        </div>

        <div className="flex flex-col gap-1.5 py-2.5">
          {draft.steps.map((step, i) => (
            <div
              key={step.id}
              className={row}
              style={{ gridTemplateColumns: columns }}>
              <StepHeader
                step={step}
                index={i}
                count={draft.steps.length}
                library={library}
                actions={actions}
              />
              {draft.sets.map((_, setIndex) => (
                <SequenceCell
                  key={setIndex}
                  step={step}
                  setIndex={setIndex}
                  exercisesById={exercisesById}
                  library={library}
                  actions={actions}
                />
              ))}
              <span />
            </div>
          ))}
          <div className={row} style={{ gridTemplateColumns: columns }}>
            <button
              type="button"
              onClick={actions.addStep}
              className={cn(GHOST_BUTTON, "h-9")}>
              <PlusIcon size={12} /> Add step
            </button>
          </div>
        </div>

        <ValueRows
          draft={draft}
          actions={actions}
          rowClass={row}
          columns={columns}
        />
      </div>
    </div>
  );
}
