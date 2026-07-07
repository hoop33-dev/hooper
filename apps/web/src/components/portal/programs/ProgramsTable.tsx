import type { ProgramSummary } from "@hooper/db";
import { ProgramStatusBadge } from "./ProgramStatusBadge";

function formatUpdatedAt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatSessionsPerWeek(
  range: ProgramSummary["sessionsPerWeek"],
): string {
  if (!range) return "no sessions yet";
  const [min, max] = range;
  return min === max ? `${min}/wk` : `${min}-${max}/wk`;
}

function ProgramNameCell({ program }: { program: ProgramSummary }) {
  const initial = program.name.trim().charAt(0).toUpperCase() || "P";
  return (
    <div className="flex items-center gap-3">
      <div className="bg-portal-orange-soft text-portal-orange flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-extrabold">
        {initial}
      </div>
      <div>
        <div className="text-portal-text1 text-[13px] font-bold">
          {program.name}
        </div>
        {program.description && (
          <div className="text-portal-text3 mt-0.5 max-w-xs truncate text-xs">
            {program.description}
          </div>
        )}
      </div>
    </div>
  );
}

interface ProgramsTableProps {
  programs: ProgramSummary[];
  onEdit: (program: ProgramSummary) => void;
}

export function ProgramsTable({ programs, onEdit }: ProgramsTableProps) {
  const columns = ["Program", "Length", "Sessions", "Status", "Updated"];
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-portal-border border-b">
          {columns.map((h) => (
            <th
              key={h}
              className="text-portal-text3 pt-4 pr-4 pb-3 text-left text-[11px] font-semibold tracking-widest uppercase">
              {h}
            </th>
          ))}
          <th className="w-20" />
        </tr>
      </thead>
      <tbody>
        {programs.map((program) => (
          <tr key={program.id} className="border-portal-border border-b">
            <td className="py-3.5 pr-4">
              <a href={`/programs/${program.id}`} className="block">
                <ProgramNameCell program={program} />
              </a>
            </td>
            <td className="text-portal-text2 py-3.5 pr-4 text-[13px]">
              {program.weeks} wk ·{" "}
              {formatSessionsPerWeek(program.sessionsPerWeek)}
            </td>
            <td className="text-portal-text2 py-3.5 pr-4 text-[13px]">
              {program.sessionCount}
            </td>
            <td className="py-3.5 pr-4">
              <ProgramStatusBadge status={program.status} />
            </td>
            <td className="text-portal-text3 py-3.5 pr-4 text-xs">
              {formatUpdatedAt(program.updated_at)}
            </td>
            <td className="py-3.5 text-right">
              <button
                type="button"
                onClick={() => onEdit(program)}
                className="border-portal-border text-portal-text2 hover:bg-portal-bg rounded-lg border px-3 py-1 text-xs font-semibold">
                Edit
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
