import { sortUnitTypes } from "@/src/constants/unitTypes";
import { resolveMostCommonId } from "@/src/lib/blockExerciseDisplay";
import { defaultUnitFor } from "@/src/lib/measurementFormat";
import { getThumbnailUrl } from "@/src/lib/videoEmbed";
import type {
  BlockExerciseMeasurementRow,
  BlockExerciseWithDetails,
  ExerciseRow,
  ExerciseStyleRow,
  SessionWithBlocks,
} from "@hooper/db";

/** "%" for % 1RM, and Time/Distance units hug the number ("20sec", "100m");
 * Weight ("60 kg") and everything else keep a space. Mirrors
 * measurementFormat.ts's HUGGING_UNIT_TYPES / formatWithUnit. */
const HUGGING_UNIT_TYPES = new Set(["% 1RM", "Time", "Distance"]);

function unitLabelFor(row: BlockExerciseMeasurementRow): string {
  if (row.unit_type === "% 1RM") return "%";
  return row.value_unit ?? defaultUnitFor(row.unit_type) ?? "";
}

/** One measurement cell's printed text. A value the athlete is meant to
 * enter (value null, or value_entered_by "athlete") shows as an em dash —
 * the coach hasn't prescribed it. */
export function formatMeasurementCell(
  row: BlockExerciseMeasurementRow,
): string {
  if (row.value == null || row.value_entered_by === "athlete") return "—";
  const unit = unitLabelFor(row);
  if (!unit) return `${row.value}`;
  return HUGGING_UNIT_TYPES.has(row.unit_type)
    ? `${row.value}${unit}`
    : `${row.value} ${unit}`;
}

/** The style name for one set: its own override when present (a null
 * override means "explicitly no style"), otherwise the placement default
 * resolved through `allStyles`. */
function setStyleName(
  be: BlockExerciseWithDetails,
  allStyles: ExerciseStyleRow[],
  setIndex: number,
): string | null {
  if (setIndex in be.setStyles) return be.setStyles[setIndex]?.name ?? null;
  if (!be.style_id) return null;
  return allStyles.find((s) => s.id === be.style_id)?.name ?? null;
}

/** The placement's headline style tag — the "most common, tie → first"
 * winner across every set (full name, unlike blockExerciseDisplay's
 * abbreviated `resolveStylePill`). Null when no set carries a style. */
export function resolveStyleName(
  be: BlockExerciseWithDetails,
  allStyles: ExerciseStyleRow[],
): string | null {
  const overrides = Object.fromEntries(
    Object.entries(be.setStyles).map(([setIndex, style]) => [
      Number(setIndex),
      style?.id ?? "",
    ]),
  );
  const { winnerId } = resolveMostCommonId(
    be.style_id ?? "",
    overrides,
    be.sets,
  );
  if (!winnerId) return null;
  const fromOverride = Object.values(be.setStyles).find(
    (s) => s?.id === winnerId,
  );
  return (
    fromOverride?.name ?? allStyles.find((s) => s.id === winnerId)?.name ?? null
  );
}

export type SetTableRow = {
  setLabel: string;
  styleName: string | null;
  /** The exercise this set actually prescribes — its per-set variant
   * override when it has one, else the placement's base exercise. */
  exerciseName: string;
  /** unit_type -> printed cell text ("65 kg", "8", "—"). */
  values: Record<string, string>;
};

export type SetTableModel = {
  /** Ordered unit-type column headers (canonical priority order). */
  unitColumns: string[];
  /** True when the sets don't all share one style — render a STYLE column. */
  showStyleColumn: boolean;
  /** True when the sets don't all prescribe the same exercise — render an
   * EXERCISE column so per-set variant overrides aren't lost. */
  showExerciseColumn: boolean;
  rows: SetTableRow[];
};

/** The printed set table for one placed exercise: a column per unit type any
 * set uses, a row per set, values pulled straight from the placement's flat
 * measurement rows (no fabricated defaults). A cell is blank when that set
 * doesn't use the column's measure, an em dash when it does but the athlete
 * fills in the value. */
export function buildSetTableModel(
  be: BlockExerciseWithDetails,
  allStyles: ExerciseStyleRow[],
): SetTableModel {
  const unitColumns = sortUnitTypes([
    ...new Set(be.measurements.map((m) => m.unit_type)),
  ]);

  const bySet = new Map<number, Map<string, BlockExerciseMeasurementRow>>();
  for (const m of be.measurements) {
    const forSet = bySet.get(m.set_index) ?? new Map();
    forSet.set(m.unit_type, m);
    bySet.set(m.set_index, forSet);
  }

  const rows: SetTableRow[] = Array.from({ length: be.sets }, (_, setIndex) => {
    const forSet = bySet.get(setIndex);
    return {
      setLabel: `${setIndex + 1}`,
      styleName: setStyleName(be, allStyles, setIndex),
      exerciseName: (be.setVariants[setIndex] ?? be.exercise).name,
      values: Object.fromEntries(
        unitColumns.map((unitType) => {
          const row = forSet?.get(unitType);
          // No row for this unit in this set → the set doesn't use that
          // measure at all: blank. A row that exists but has no coach value
          // (athlete records it) → em dash, via formatMeasurementCell.
          return [unitType, row ? formatMeasurementCell(row) : ""];
        }),
      ),
    };
  });

  const distinctStyles = new Set(rows.map((r) => r.styleName ?? ""));
  const distinctExercises = new Set(rows.map((r) => r.exerciseName));
  return {
    unitColumns,
    showStyleColumn: distinctStyles.size > 1,
    showExerciseColumn: distinctExercises.size > 1,
    rows,
  };
}

/** A/B/C… label for a superset exercise, by its position in the block. */
export function supersetLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

/** The block's meta line: superset rounds + how to run it, or an exercise
 * count. `letters` is the last superset letter (e.g. "C" for a 3-exercise
 * superset) so it reads "complete A–C back to back". */
export function blockMetaLine(
  isSuperset: boolean,
  rounds: number | null,
  exerciseCount: number,
): string {
  if (isSuperset) {
    const n = rounds ?? 1;
    const last = supersetLetter(Math.max(0, exerciseCount - 1));
    const range = exerciseCount > 1 ? `A–${last}` : "A";
    return `${n} round${n === 1 ? "" : "s"} · complete ${range} back to back`;
  }
  return `${exerciseCount} exercise${exerciseCount === 1 ? "" : "s"}`;
}

/** A YouTube thumbnail URL for a link video, the captured thumbnail for an
 * uploaded one, or null when there's no usable image. */
export function thumbnailFor(
  exercise: Pick<
    ExerciseRow,
    "video_source" | "video_url" | "video_thumbnail_url"
  >,
): string | null {
  if (exercise.video_source === "upload")
    return exercise.video_thumbnail_url ?? null;
  if (exercise.video_url) return getThumbnailUrl(exercise.video_url);
  return null;
}

export function countExercises(session: SessionWithBlocks): number {
  return session.blocks.reduce((sum, b) => sum + b.exercises.length, 0);
}

/** Sessions grouped by the given week numbers, in ascending week order and
 * (position) order within a week — a selected week with no sessions is still
 * represented (empty). */
export function groupSessionsByWeek(
  sessions: SessionWithBlocks[],
  weekNumbers: number[],
): { weekNumber: number; sessions: SessionWithBlocks[] }[] {
  const byWeek = new Map<number, SessionWithBlocks[]>();
  for (const s of sessions) {
    const list = byWeek.get(s.week_number) ?? [];
    list.push(s);
    byWeek.set(s.week_number, list);
  }
  return [...weekNumbers]
    .sort((a, b) => a - b)
    .map((weekNumber) => ({
      weekNumber,
      sessions: [...(byWeek.get(weekNumber) ?? [])].sort(
        (a, b) => a.position - b.position,
      ),
    }));
}

/** "1,2,5" -> [1, 2, 5]; drops anything that isn't an integer. Pair with
 * `resolveExportWeeks` to clamp to the program's real week count. */
export function parseWeeksParam(raw: string): number[] {
  return raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n));
}

/** Normalises a raw `weeks` selection (query param, or missing) to a sorted,
 * de-duped list of valid week numbers within `1..totalWeeks`. Falls back to
 * the whole program when nothing valid is left. */
export function resolveExportWeeks(
  raw: number[] | null | undefined,
  totalWeeks: number,
): number[] {
  const all = Array.from({ length: totalWeeks }, (_, i) => i + 1);
  const valid = [...new Set(raw ?? [])]
    .filter((w) => Number.isInteger(w) && w >= 1 && w <= totalWeeks)
    .sort((a, b) => a - b);
  return valid.length > 0 ? valid : all;
}

/** How the export's week coverage reads on the cover / running header:
 * "" when it's the whole program, "Week 4 of 12" for one,
 * "Weeks 3–5 of 12" for a contiguous run, "3 of 12 weeks" otherwise. */
export function weekCoverageLabel(weeks: number[], totalWeeks: number): string {
  if (weeks.length >= totalWeeks) return "";
  if (weeks.length === 1) return `Week ${weeks[0]} of ${totalWeeks}`;
  const contiguous = weeks.every((w, i) => i === 0 || w === weeks[i - 1]! + 1);
  if (contiguous) {
    return `Weeks ${weeks[0]}–${weeks[weeks.length - 1]} of ${totalWeeks}`;
  }
  return `${weeks.length} of ${totalWeeks} weeks`;
}

/** "4 / week" or "3–4 / week" from the real session rows. */
export function sessionsPerWeekLabel(sessions: SessionWithBlocks[]): string {
  if (sessions.length === 0) return "—";
  const counts = new Map<number, number>();
  for (const s of sessions)
    counts.set(s.week_number, (counts.get(s.week_number) ?? 0) + 1);
  const values = [...counts.values()];
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? `${min} / week` : `${min}–${max} / week`;
}
