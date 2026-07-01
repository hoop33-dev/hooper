interface WeekTabStripProps {
  totalWeeks: number;
  selectedWeek: number;
  onSelect: (week: number) => void;
}

export function WeekTabStrip({
  totalWeeks,
  selectedWeek,
  onSelect,
}: WeekTabStripProps) {
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);
  return (
    <div className="border-portal-border bg-portal-card flex flex-shrink-0 items-center gap-1 overflow-x-auto border-b px-5 py-2">
      {weeks.map((w) => (
        <button
          key={w}
          type="button"
          onClick={() => onSelect(w)}
          className={`h-7 flex-shrink-0 rounded-md px-3 text-xs font-semibold transition ${
            w === selectedWeek
              ? "bg-portal-orange text-white"
              : "border-portal-border text-portal-text2 border"
          }`}>
          Wk {w}
        </button>
      ))}
    </div>
  );
}
