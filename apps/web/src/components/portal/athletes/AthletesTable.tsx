"use client";

import type { AssignedProgramRef, AthleteSummary } from "@hooper/db";
import { PortalAvatar } from "../ui/PortalAvatar";

function formatAssignedPrograms(programs: AssignedProgramRef[]): string {
  if (programs.length === 0) return "";
  if (programs.length === 1) return programs[0].name;
  return `${programs[0].name} +${programs.length - 1}`;
}

interface AthletesTableProps {
  athletes: AthleteSummary[];
  onSelect: (athlete: AthleteSummary) => void;
  onAssignClick: (athlete: AthleteSummary) => void;
}

export function AthletesTable({
  athletes,
  onSelect,
  onAssignClick,
}: AthletesTableProps) {
  const columns = ["Athlete", "Program", "Last Active"];

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
          <th className="w-24" />
        </tr>
      </thead>
      <tbody>
        {athletes.map((athlete) => (
          <tr
            key={athlete.id}
            onClick={() => onSelect(athlete)}
            className="border-portal-border hover:bg-portal-bg cursor-pointer border-b">
            <td className="py-3.5 pr-4">
              <div className="flex items-center gap-3">
                <PortalAvatar
                  firstName={athlete.first_name}
                  avatarUrl={athlete.avatar_url}
                />
                <div>
                  <div className="text-portal-text1 text-[13px] font-bold">
                    {athlete.first_name} {athlete.last_name}
                  </div>
                  <div className="text-portal-text3 text-xs">
                    @{athlete.username}
                  </div>
                </div>
              </div>
            </td>
            <td className="text-portal-text2 py-3.5 pr-4 text-[13px]">
              {formatAssignedPrograms(athlete.assignedPrograms)}
            </td>
            {/* No activity tracking exists yet (no session/login signal a
                coach can read), so this is a placeholder until that's built. */}
            <td className="text-portal-text3 py-3.5 pr-4 text-xs">—</td>
            <td className="py-3.5 text-right">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAssignClick(athlete);
                }}
                className="bg-portal-orange rounded-lg px-3 py-1 text-xs font-semibold text-white hover:brightness-110">
                Assign
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
