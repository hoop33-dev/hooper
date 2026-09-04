"use client";

import { AppLink } from "@/src/components/portal/ui/AppLink";
import type { TeamSummary } from "@hooper/db";
import { ProgramBadge } from "../ProgramBadge";

function TeamNameCell({ team }: { team: TeamSummary }) {
  const initial = team.name.trim().charAt(0).toUpperCase() || "T";
  return (
    <div className="flex items-center gap-3">
      <div className="bg-portal-orange-soft text-portal-orange flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-extrabold">
        {team.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={team.avatar_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          initial
        )}
      </div>
      <div>
        <div className="text-portal-text1 text-[13px] font-bold">
          {team.name}
        </div>
        {team.description && (
          <div className="text-portal-text3 mt-0.5 max-w-xs truncate text-xs">
            {team.description}
          </div>
        )}
      </div>
    </div>
  );
}

interface TeamsTableProps {
  teams: TeamSummary[];
}

export function TeamsTable({ teams }: TeamsTableProps) {
  const columns = ["Team", "Program", "Members"];

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
        </tr>
      </thead>
      <tbody>
        {teams.map((team) => (
          <tr
            key={team.id}
            className="border-portal-border hover:bg-portal-bg relative cursor-pointer border-b">
            <td className="py-3.5 pr-4">
              <AppLink
                href={`/athletes/teams/${team.id}`}
                className="after:absolute after:inset-0 after:z-0">
                <TeamNameCell team={team} />
              </AppLink>
            </td>
            <td className="py-3.5 pr-4">
              <ProgramBadge programs={team.programs} />
            </td>
            <td className="text-portal-text2 py-3.5 pr-4 text-[13px]">
              {team.memberCount}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
