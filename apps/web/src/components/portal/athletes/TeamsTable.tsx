"use client";

import type { TeamSummary } from "@hooper/db";
import { useRouter } from "next/navigation";
import { PortalBadge } from "../ui/PortalBadge";

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
}

export function TeamsTable({ teams }: TeamsTableProps) {
  const router = useRouter();
  const columns = ["Team", "Athletes", "Assigned", "Created"];

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
            onClick={() => router.push(`/athletes/${team.id}`)}
            className="border-portal-border hover:bg-portal-bg cursor-pointer border-b">
            <td className="py-3.5 pr-4">
              <TeamNameCell team={team} />
            </td>
            <td className="text-portal-text2 py-3.5 pr-4 text-[13px]">
              {team.memberCount}
            </td>
            <td className="py-3.5 pr-4">
              {team.assignedCount > 0 ? (
                <PortalBadge variant="orange">
                  {team.assignedCount}{" "}
                  {team.assignedCount === 1 ? "assignment" : "assignments"}
                </PortalBadge>
              ) : (
                <PortalBadge variant="neutral">Not assigned</PortalBadge>
              )}
            </td>
            <td className="text-portal-text3 py-3.5 pr-4 text-xs">
              {new Date(team.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
