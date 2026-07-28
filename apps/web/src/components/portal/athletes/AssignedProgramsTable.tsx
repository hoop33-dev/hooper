"use client";

import type { AssignedProgramRef } from "@hooper/db";
import { InlineConfirmDelete } from "../ui/InlineConfirmDelete";
import { PortalButton } from "../ui/PortalButton";

type Variant = "athlete" | "team";

interface AssignedProgramsTableProps {
  programs: AssignedProgramRef[];
  variant: Variant;
  onAssignClick: () => void;
  onUnassign: (programId: string) => Promise<void>;
}

// Sessions complete / week / last completed have no backing data yet (there's
// no session-completion tracking table) — the columns render as placeholders
// until that's wired up.
const COLUMNS: Record<Variant, string[]> = {
  athlete: ["Program", "Sessions complete", "Week", "Last completed session"],
  team: ["Program", "Sessions complete", "Avg. week", "Last completed"],
};

export function AssignedProgramsTable({
  programs,
  variant,
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
              {programs.map((program) => (
                <tr
                  key={program.id}
                  className="border-portal-border border-b last:border-b-0">
                  <td className="text-portal-text1 py-3.5 pr-4 text-[13px] font-bold">
                    {program.name}
                  </td>
                  <td className="text-portal-text3 py-3.5 pr-4 text-xs">—</td>
                  <td className="text-portal-text3 py-3.5 pr-4 text-xs">—</td>
                  <td className="text-portal-text3 py-3.5 pr-4 text-xs">—</td>
                  <td className="py-3.5 pr-1">
                    <InlineConfirmDelete
                      onDelete={() => onUnassign(program.id)}
                      idleTitle="Remove program"
                      idleClassName="text-portal-text3 hover:text-red-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
