"use client";

import type { AssignedProgramRef, TeamSummary } from "@hooper/db";
import { useRouter } from "next/navigation";

function formatAssignedPrograms(programs: AssignedProgramRef[]): string {
  if (programs.length === 0) return "";
  if (programs.length === 1) return programs[0].name;
  return `${programs[0].name} +${programs.length - 1}`;
}

function TeamNameCell({ team }: { team: TeamSummary }) {
  const initial = team.name.trim().charAt(0).toUpperCase() || "T";
  return (
    <div className="flex items-center gap-3">
      <div className="bg-portal-orange-soft text-portal-orange flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-extrabold">
        {initial}
      </div>
      <div className="text-portal-text1 text-[13px] font-bold">{team.name}</div>
    </div>
  );
}

interface TeamsTableProps {
  teams: TeamSummary[];
  onAssignClick: (team: TeamSummary) => void;
}

export function TeamsTable({ teams, onAssignClick }: TeamsTableProps) {
  const router = useRouter();
  const columns = ["Team", "Program", "Athletes"];

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
        {teams.map((team) => (
          <tr
            key={team.id}
            onClick={() => router.push(`/athletes/${team.id}`)}
            className="border-portal-border hover:bg-portal-bg cursor-pointer border-b">
            <td className="py-3.5 pr-4">
              <TeamNameCell team={team} />
            </td>
            <td className="text-portal-text2 py-3.5 pr-4 text-[13px]">
              {formatAssignedPrograms(team.assignedPrograms)}
            </td>
            <td className="text-portal-text2 py-3.5 pr-4 text-[13px]">
              {team.memberCount}
            </td>
            <td className="py-3.5 text-right">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAssignClick(team);
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
