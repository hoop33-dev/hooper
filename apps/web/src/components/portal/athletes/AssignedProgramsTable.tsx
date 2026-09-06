"use client";

import type { AssignedProgramRef, ProgramProgressStats } from "@hooper/db";
import { AppLink } from "../ui/AppLink";
import { InlineConfirmDelete } from "../ui/InlineConfirmDelete";
import { PortalButton } from "../ui/PortalButton";

type Variant = "athlete" | "team";

interface AssignedProgramsTableProps {
  programs: AssignedProgramRef[];
  variant: Variant;
  /** Per-program progress keyed by program id. A missing entry (e.g. a
   * just-assigned program) renders as dashes. */
  stats?: Record<string, ProgramProgressStats>;
  onAssignClick: () => void;
  onUnassign: (programId: string) => Promise<void>;
}

const COLUMNS: Record<Variant, string[]> = {
  athlete: ["Program", "Sessions complete", "Week", "Last completed session"],
  team: ["Program", "Sessions complete", "Avg. week", "Last completed"],
};

const DASH = "—";

function formatLastCompleted(iso: string | null): string {
  if (!iso) return DASH;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return DASH;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AssignedProgramsTable({
  programs,
  variant,
  stats,
  onAssignClick,
  onUnassign,
}: AssignedProgramsTableProps) {
  const columns = COLUMNS[variant];

  return (
    <div className="border-portal-border bg-portal-card rounded-xl border">
      <div className="border-portal-border flex items-center justify-between border-b px-5 py-4">
        <h3 className="text-portal-text1 text-sm font-bold">
          Assigned programs
        </h3>
        <PortalButton size="sm" variant="primary" onClick={onAssignClick}>
          Assign programs
        </PortalButton>
      </div>

      {programs.length === 0 ? (
        <p className="text-portal-text3 px-5 py-4 text-xs">
          No programs assigned yet.
        </p>
      ) : (
        <div className="overflow-x-auto px-5">
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
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {programs.map((program) => {
                const progress = stats?.[program.id];
                const sessionsComplete =
                  progress && progress.sessionsComplete > 0
                    ? String(progress.sessionsComplete)
                    : DASH;
                const week =
                  progress && progress.week != null
                    ? String(progress.week)
                    : DASH;
                const lastCompleted = formatLastCompleted(
                  progress?.lastCompletedAt ?? null,
                );

                return (
                  <tr
                    key={program.id}
                    className="border-portal-border hover:bg-portal-bg relative cursor-pointer border-b last:border-b-0">
                    <td className="text-portal-text1 py-3.5 pr-4 text-[13px] font-bold">
                      <AppLink
                        href={`/programs/${program.id}`}
                        className="after:absolute after:inset-0 after:z-0">
                        {program.name}
                      </AppLink>
                    </td>
                    <td className="text-portal-text3 py-3.5 pr-4 text-xs">
                      {sessionsComplete}
                    </td>
                    <td className="text-portal-text3 py-3.5 pr-4 text-xs">
                      {week}
                    </td>
                    <td className="text-portal-text3 py-3.5 pr-4 text-xs">
                      {lastCompleted}
                    </td>
                    <td className="relative z-10 py-3.5 pr-1">
                      <InlineConfirmDelete
                        onDelete={() => onUnassign(program.id)}
                        idleTitle="Remove program"
                        idleClassName="text-portal-text3 hover:text-red-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
