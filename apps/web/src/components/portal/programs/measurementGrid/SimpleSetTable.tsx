"use client";

import { sortUnitTypes } from "@/src/constants/unitTypes";
import type { ExerciseRow, ExerciseStyleRow } from "@hooper/db";
import { SetInlineSelect } from "./SetInlineSelect";
import { AthleteEnteredBadge, StepperInput } from "./SetValueCell";
import { mostCommon, type SetConfigState } from "./setConfig";

/** Small red dot marking a set whose variant and/or style differs from the
 * one shown in the Variant/Style pickers above — hover (native title
 * tooltip) reveals what it actually is, since the simplified view has
 * nowhere else to show it. */
function InfoBadge({ details }: { details: string }) {
  return (
    <span
      title={details}
      className="flex h-3.5 w-3.5 flex-shrink-0 cursor-help items-center justify-center rounded-full bg-red-500 text-white">
      <svg width="3" height="8" viewBox="0 0 3 8" fill="currentColor">
        <circle cx="1.5" cy="1" r="1" />
        <rect x="0.5" y="3" width="2" height="5" rx="1" />
      </svg>
    </span>
  );
}

/** One set's row in the simplified table — extracted out of SimpleSetTable
 * so that component stays under the lint's max-lines-per-function limit. */
function SimpleSetRow({
  label,
  config,
  unitTypes,
  gridCols,
  variantDiffers,
  ownVariantName,
  styleDiffers,
  ownStyleName,
  onChangeValue,
  onToggleAthlete,
}: {
  label: string;
  config: SetConfigState;
  unitTypes: string[];
  gridCols: string;
  variantDiffers: boolean;
  ownVariantName: string;
  styleDiffers: boolean;
  ownStyleName: string;
  onChangeValue: (slotIndex: number, value: number) => void;
  onToggleAthlete: (slotIndex: number, athleteEntered: boolean) => void;
}) {
  const differences = [
    ...(variantDiffers ? [`Variant: ${ownVariantName}`] : []),
    ...(styleDiffers ? [`Style: ${ownStyleName || "No style"}`] : []),
  ];
  return (
    <div
      className="border-portal-border grid items-center gap-2 border-t pt-2"
      style={{ gridTemplateColumns: gridCols }}>
      <span className="text-portal-text1 flex items-center gap-1 text-[13px] font-bold">
        {label}
        {differences.length > 0 && (
          <InfoBadge details={differences.join(", ")} />
        )}
      </span>
      {unitTypes.map((unitType) => {
        const slotIndex = config.slots.findIndex(
          (s) => s.unit_type === unitType,
        );
        if (slotIndex === -1) return <span key={unitType} />;
        const slot = config.slots[slotIndex]!;
        const athleteEntered = slot.value_entered_by === "athlete";
        return (
          <div
            key={unitType}
            className="border-portal-border bg-portal-card relative flex h-10 items-center justify-center gap-1 rounded-lg border px-2">
            {athleteEntered ? (
              <span className="text-portal-text3 text-[11px] italic">
                Athlete
              </span>
            ) : (
              <>
                <StepperInput
                  value={slot.value}
                  min={0}
                  onChange={(v) => onChangeValue(slotIndex, v)}
                  className="font-title text-portal-orange w-full text-center text-base font-black"
                />
                {slot.value_unit && (
                  <span className="text-portal-text3 flex-shrink-0 text-[10px]">
                    {slot.value_unit}
                  </span>
                )}
              </>
            )}
            <AthleteEnteredBadge
              checked={athleteEntered}
              onChange={(v) => onToggleAthlete(slotIndex, v)}
            />
          </div>
        );
      })}
    </div>
  );
}

/** The "hide additional info" simplified view: one Variant/Style picker for
 * the whole placement (editing it applies to every set/round) plus shared
 * value columns — one per unit type used by ANY set, blank for a set that
 * doesn't use it — instead of each set's own independent unit-type/variant/
 * style controls. A set whose variant already differs from the one shown
 * gets a small red info badge rather than losing that information
 * silently. Shared by the single-exercise modal ("Set N" rows) and the
 * superset editor (its exercise sections pass "Rd N" instead). */
export function SimpleSetTable({
  rowLabel,
  configs,
  variantOptions,
  styles,
  onChangeVariantAll,
  onChangeStyleAll,
  onChangeValue,
  onToggleAthlete,
}: {
  rowLabel: (index: number) => string;
  configs: SetConfigState[];
  variantOptions: ExerciseRow[];
  styles: ExerciseStyleRow[];
  onChangeVariantAll: (id: string) => void;
  onChangeStyleAll: (id: string) => void;
  onChangeValue: (setIndex: number, slotIndex: number, value: number) => void;
  onToggleAthlete: (
    setIndex: number,
    slotIndex: number,
    athleteEntered: boolean,
  ) => void;
}) {
  const dominantVariantId = mostCommon(configs.map((c) => c.variantId));
  const dominantStyleId = mostCommon(configs.map((c) => c.styleId));
  const unitTypes = sortUnitTypes([
    ...new Set(configs.flatMap((c) => c.slots.map((s) => s.unit_type))),
  ]);
  const gridCols = `72px repeat(${unitTypes.length}, minmax(0, 1fr))`;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        {variantOptions.length > 1 && (
          <SetInlineSelect
            options={variantOptions}
            value={dominantVariantId}
            onChange={onChangeVariantAll}
            noneLabel="Variant"
            allowNone={false}
            mutedValue={variantOptions[0]?.id}
          />
        )}
        <SetInlineSelect
          options={styles}
          value={dominantStyleId}
          onChange={onChangeStyleAll}
          noneLabel="No style"
        />
      </div>
      {unitTypes.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="grid gap-2" style={{ gridTemplateColumns: gridCols }}>
            <span />
            {unitTypes.map((unitType) => (
              <span
                key={unitType}
                className="text-portal-text3 text-center text-[10px] font-bold tracking-wide uppercase">
                {unitType}
              </span>
            ))}
          </div>
          {configs.map((config, setIndex) => (
            <SimpleSetRow
              key={setIndex}
              label={rowLabel(setIndex)}
              config={config}
              unitTypes={unitTypes}
              gridCols={gridCols}
              variantDiffers={config.variantId !== dominantVariantId}
              ownVariantName={
                variantOptions.find((v) => v.id === config.variantId)?.name ??
                ""
              }
              styleDiffers={config.styleId !== dominantStyleId}
              ownStyleName={
                styles.find((s) => s.id === config.styleId)?.name ?? ""
              }
              onChangeValue={(slotIndex, value) =>
                onChangeValue(setIndex, slotIndex, value)
              }
              onToggleAthlete={(slotIndex, athleteEntered) =>
                onToggleAthlete(setIndex, slotIndex, athleteEntered)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
