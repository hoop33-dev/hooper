"use client";

import { cn } from "@/src/lib/cn";
import { defaultUnitFor } from "@/src/lib/measurementFormat";
import type { UnitTypeRow } from "@hooper/db";
import { CheckIcon } from "../ui/icons";
import {
  draftUnitTypes,
  MAX_SEQUENCE_UNITS,
  type EditorSequence,
} from "./sequenceDraft";
import type { SequenceEditorActions } from "./useSequenceEditor";

const LABEL =
  "text-portal-text3 mb-1.5 text-[11px] font-semibold tracking-[0.1em] uppercase";

export function SequenceUnitChips({
  draft,
  actions,
  unitTypes,
}: {
  draft: EditorSequence;
  actions: SequenceEditorActions;
  unitTypes: UnitTypeRow[];
}) {
  const selected = draftUnitTypes(draft);
  // Units a placement already tracks stay visible even if they've since
  // been removed from the catalog.
  const names = [
    ...unitTypes.map((u) => u.name),
    ...selected.filter((n) => !unitTypes.some((u) => u.name === n)),
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {names.map((name) => {
        const on = selected.includes(name);
        const full = !on && selected.length >= MAX_SEQUENCE_UNITS;
        const unit = defaultUnitFor(name);
        return (
          <button
            key={name}
            type="button"
            disabled={full}
            onClick={() => actions.toggleUnit(name)}
            className={cn(
              "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40",
              on
                ? "border-portal-orange/40 bg-portal-orange-soft text-portal-orange"
                : "border-portal-border text-portal-text2 bg-white",
            )}>
            {on && <CheckIcon size={11} />}
            {name}
            {unit && (
              <span
                className={
                  on ? "font-normal" : "text-portal-text3 font-normal"
                }>
                {unit}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** The units the sequence tracks. */
export function SequenceHeader({
  draft,
  actions,
  unitTypes,
}: {
  draft: EditorSequence;
  actions: SequenceEditorActions;
  unitTypes: UnitTypeRow[];
}) {
  return (
    <div>
      <div className={LABEL}>
        Track{" "}
        <span className="text-portal-text3 font-normal tracking-normal normal-case">
          (up to 3, 1 rep = 1 full run)
        </span>
      </div>
      <SequenceUnitChips
        draft={draft}
        actions={actions}
        unitTypes={unitTypes}
      />
    </div>
  );
}
