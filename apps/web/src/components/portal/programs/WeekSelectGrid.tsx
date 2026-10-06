"use client";

interface WeekSelectGridProps {
  totalWeeks: number;
  /** Selected week numbers (1-based). */
  selected: number[];
  onToggle: (week: number) => void;
  /** A week that can't be toggled — locked on and marked with a dot (e.g. a
   * session's own week in the duplicate flow). Omit when every week is
   * togglable. */
  lockedWeek?: number;
  lockedTitle?: string;
}

/** The `Wk N` chip grid shared by the session-duplicate and program-export
 * modals — 6 per row, orange when selected. */
export function WeekSelectGrid({
  totalWeeks,
  selected,
  onToggle,
  lockedWeek,
  lockedTitle,
}: WeekSelectGridProps) {
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {weeks.map((w) => {
        const isSelected = selected.includes(w);
        const isLocked = w === lockedWeek;
        return (
          <button
            key={w}
            type="button"
            onClick={() => onToggle(w)}
            disabled={isLocked}
            title={isLocked ? lockedTitle : undefined}
            className={`relative h-11 rounded-lg border text-xs font-bold ${
              isSelected
                ? "border-portal-orange bg-portal-orange-soft text-portal-orange"
                : "border-portal-border text-portal-text2"
            } ${isLocked ? "cursor-default" : ""}`}>
            {isLocked && (
              <span className="bg-portal-orange absolute top-1 right-1 h-1 w-1 rounded-full" />
            )}
            Wk {w}
          </button>
        );
      })}
    </div>
  );
}
