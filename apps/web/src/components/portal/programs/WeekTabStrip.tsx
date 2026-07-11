import { SpinnerIcon, XIcon } from "../ui/icons";
import { useInlineConfirm } from "../ui/useInlineConfirm";

interface WeekTabStripProps {
  totalWeeks: number;
  selectedWeek: number;
  onSelect: (week: number) => void;
  onOpenAddWeek: () => void;
  onDeleteWeek: (week: number) => void;
  updatedAt: string;
  updatedByName: string | null;
}

function formatEditedAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function WeekTab({
  week,
  selected,
  showDelete,
  onSelect,
  onDelete,
}: {
  week: number;
  selected: boolean;
  showDelete: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { armed, confirming, arm, confirm } = useInlineConfirm(onDelete);

  if (confirming) {
    return (
      <div className="border-portal-border flex h-7 w-14 flex-shrink-0 items-center justify-center rounded-md border">
        <SpinnerIcon size={11} />
      </div>
    );
  }

  if (armed) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          confirm();
        }}
        title="Click to confirm delete"
        className="h-7 flex-shrink-0 rounded-md border border-red-500 px-2.5 text-xs font-semibold text-red-500 hover:bg-red-50">
        Confirm?
      </button>
    );
  }

  return (
    <div className="group relative flex-shrink-0">
      <button
        type="button"
        onClick={onSelect}
        className={`h-7 rounded-md px-3 text-xs font-semibold transition-all ${
          showDelete ? "group-hover:pr-6" : ""
        } ${
          selected
            ? "bg-portal-orange text-white"
            : "border-portal-border text-portal-text2 border"
        }`}>
        Wk {week}
      </button>
      {showDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            arm();
          }}
          title="Delete week"
          className={`pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 ${
            selected
              ? "text-white/70 hover:text-white"
              : "text-portal-text3 hover:text-red-500"
          }`}>
          <XIcon size={9} />
        </button>
      )}
    </div>
  );
}

export function WeekTabStrip({
  totalWeeks,
  selectedWeek,
  onSelect,
  onOpenAddWeek,
  onDeleteWeek,
  updatedAt,
  updatedByName,
}: WeekTabStripProps) {
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);
  return (
    <div className="border-portal-border bg-portal-card flex flex-shrink-0 items-center gap-3 border-b px-5 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {weeks.map((w) => (
          <WeekTab
            key={w}
            week={w}
            selected={w === selectedWeek}
            showDelete={totalWeeks > 1}
            onSelect={() => onSelect(w)}
            onDelete={() => onDeleteWeek(w)}
          />
        ))}
        <button
          type="button"
          onClick={onOpenAddWeek}
          title="Add week"
          className="border-portal-border-mid text-portal-text3 h-7 flex-shrink-0 rounded-md border border-dashed px-3 text-xs font-semibold">
          + Week
        </button>
      </div>
      <span className="text-portal-text3 flex-shrink-0 text-xs">
        Last edited{updatedByName ? ` by ${updatedByName}` : ""} at{" "}
        {formatEditedAt(updatedAt)}
      </span>
    </div>
  );
}
