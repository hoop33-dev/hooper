"use client";

import type { TeamMemberSummary } from "@hooper/db";
import { InlineConfirmDelete } from "../ui/InlineConfirmDelete";

interface TeamRosterTableProps {
  members: TeamMemberSummary[];
  onRemove: (playerId: string) => void | Promise<void>;
}

export function TeamRosterTable({ members, onRemove }: TeamRosterTableProps) {
  const columns = ["Athlete", "Username", "Added"];

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
        {members.map((member) => (
          <tr
            key={member.player_id}
            className="border-portal-border hover:bg-portal-bg border-b">
            <td className="py-3.5 pr-4">
              <div className="flex items-center gap-3">
                <div className="bg-portal-orange-soft text-portal-orange flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-extrabold">
                  {(member.first_name.charAt(0) || "?").toUpperCase()}
                </div>
                <div className="text-portal-text1 text-[13px] font-bold">
                  {member.first_name} {member.last_name}
                </div>
              </div>
            </td>
            <td className="text-portal-text2 py-3.5 pr-4 text-[13px]">
              @{member.username}
            </td>
            <td className="text-portal-text3 py-3.5 pr-4 text-xs">
              {new Date(member.added_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </td>
            <td className="py-3.5 text-right">
              <div className="flex justify-end">
                <InlineConfirmDelete
                  idleTitle="Remove from team"
                  idleClassName="text-portal-text3 hover:text-red-500"
                  onDelete={() => onRemove(member.player_id)}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
