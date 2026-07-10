"use client";

import type { MeasurementInput } from "@/src/services/block.service";
import type { BlockWithExercises } from "@hooper/db";
import { useState } from "react";
import { PortalButton } from "../ui/PortalButton";
import { XIcon } from "../ui/icons";
import { useModalDismiss } from "../ui/useModalDismiss";
import {
  initMeasurements,
  MeasurementColumnHeader,
  resolveUnitTypes,
  SetRow,
  withCellPatch,
  withFirstCopiedToAll,
  withUnitChange,
  type MeasurementState,
} from "./BlockExerciseMeasurementModal";

/** Applies a per-exercise measurement-state edit to one entry of a
 * `{ [exerciseId]: MeasurementState[] }` map, leaving the rest untouched —
 * the shared shape of every updater below. */
function withExerciseEdit(
  byExercise: Record<string, MeasurementState[]>,
  exerciseId: string,
  edit: (measurements: MeasurementState[]) => MeasurementState[],
): Record<string, MeasurementState[]> {
  return { ...byExercise, [exerciseId]: edit(byExercise[exerciseId]) };
}

/** Editing a superset's shared rounds: every exercise in the block shares
 * the same round count (set on the block itself, see BlockCard's Superset
 * control), so this edits every exercise's per-round values together in one
 * modal instead of bouncing between one BlockExerciseMeasurementModal per
 * exercise to keep rounds in sync. */
interface SupersetRoundsModalProps {
  block: BlockWithExercises;
  onClose: () => void;
  onSave: (
    perExercise: { id: string; measurements: MeasurementInput[] }[],
  ) => Promise<void>;
}

function toMeasurementInputs(
  measurements: MeasurementState[],
): MeasurementInput[] {
  return measurements.map((m) => ({
    unit_type: m.unit_type,
    value_unit: m.value_unit,
    sets: m.sets.map((s) => ({
      value: s.value_entered_by === "athlete" ? null : Math.max(0, s.value),
      value_entered_by: s.value_entered_by,
    })),
  }));
}

function ExerciseSection({
  name,
  measurements,
  rounds,
  onChangeValue,
  onToggleAthlete,
  onUnitChange,
  onCopyFirstToAll,
}: {
  name: string;
  measurements: MeasurementState[];
  rounds: number;
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
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-portal-text1 text-[13px] font-bold">{name}</span>
      {measurements.length > 0 && (
        <>
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
          {Array.from({ length: rounds }, (_, setIndex) => (
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
        </>
      )}
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
  onClose,
  onSave,
  saving,
}: {
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="border-portal-border bg-portal-bg flex flex-shrink-0 items-center justify-end gap-2 border-t px-4 py-3">
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

export function SupersetRoundsModal({
  block,
  onClose,
  onSave,
}: SupersetRoundsModalProps) {
  const rounds = block.sets ?? 1;
  const [byExercise, setByExercise] = useState<
    Record<string, MeasurementState[]>
  >(() =>
    Object.fromEntries(
      block.exercises.map((be) => [
        be.id,
        initMeasurements(resolveUnitTypes(be), be, rounds),
      ]),
    ),
  );
  const [saving, setSaving] = useState(false);
  const onBackdropClick = useModalDismiss(onClose);

  function updateCell(
    exerciseId: string,
    measurementIndex: number,
    setIndex: number,
    patch: Partial<MeasurementState["sets"][number]>,
  ) {
    setByExercise((prev) =>
      withExerciseEdit(prev, exerciseId, (m) =>
        withCellPatch(m, measurementIndex, setIndex, patch),
      ),
    );
  }

  function updateUnit(
    exerciseId: string,
    measurementIndex: number,
    newUnit: string,
  ) {
    setByExercise((prev) =>
      withExerciseEdit(prev, exerciseId, (m) =>
        withUnitChange(m, measurementIndex, newUnit),
      ),
    );
  }

  function copyFirstToAll(exerciseId: string, measurementIndex: number) {
    setByExercise((prev) =>
      withExerciseEdit(prev, exerciseId, (m) =>
        withFirstCopiedToAll(m, measurementIndex),
      ),
    );
  }

  async function handleSave() {
    setSaving(true);
    await onSave(
      block.exercises.map((be) => ({
        id: be.id,
        measurements: toMeasurementInputs(byExercise[be.id]),
      })),
    );
    setSaving(false);
  }

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="bg-portal-card flex max-h-[640px] w-full max-w-sm flex-col overflow-hidden rounded-2xl shadow-2xl">
        <ModalHeader name={block.name} rounds={rounds} onClose={onClose} />
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
          {block.exercises.map((be) => (
            <ExerciseSection
              key={be.id}
              name={be.exercise.name}
              measurements={byExercise[be.id]}
              rounds={rounds}
              onChangeValue={(mi, si, value) =>
                updateCell(be.id, mi, si, { value })
              }
              onToggleAthlete={(mi, si, athleteEntered) =>
                updateCell(be.id, mi, si, {
                  value_entered_by: athleteEntered ? "athlete" : "coach",
                })
              }
              onUnitChange={(mi, unit) => updateUnit(be.id, mi, unit)}
              onCopyFirstToAll={(mi) => copyFirstToAll(be.id, mi)}
            />
          ))}
        </div>
        <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} />
      </div>
    </div>
  );
}
