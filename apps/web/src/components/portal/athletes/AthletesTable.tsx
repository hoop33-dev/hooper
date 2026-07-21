"use client";

import type { AthleteSummary } from "@hooper/db";
import { PortalAvatar } from "../ui/PortalAvatar";
import { PortalBadge } from "../ui/PortalBadge";

interface AthletesTableProps {
  athletes: AthleteSummary[];
  onSelect: (athlete: AthleteSummary) => void;
}

export function AthletesTable({ athletes, onSelect }: AthletesTableProps) {
  const columns = ["Athlete", "Username", "Teams", "Assigned"];

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
                <div className="text-portal-text1 text-[13px] font-bold">
                  {athlete.first_name} {athlete.last_name}
                </div>
              </div>
            </td>
            <td className="text-portal-text2 py-3.5 pr-4 text-[13px]">
              @{athlete.username}
            </td>
            <td className="py-3.5 pr-4">
              {athlete.teamNames.length === 0 ? (
                <span className="text-portal-text3 text-xs">No team</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {athlete.teamNames.map((name) => (
                    <PortalBadge key={name} variant="neutral">
                      {name}
                    </PortalBadge>
                  ))}
                </div>
              )}
            </td>
            <td className="py-3.5 pr-4">
              {athlete.assignedProgramCount > 0 ? (
                <PortalBadge variant="orange">
                  {athlete.assignedProgramCount}{" "}
                  {athlete.assignedProgramCount === 1 ? "program" : "programs"}
                </PortalBadge>
              ) : (
                <PortalBadge variant="neutral">None</PortalBadge>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
