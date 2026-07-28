"use client";

import type { AthleteSummary, TeamMember } from "@hooper/db";
import { useState } from "react";
import { InlineConfirmDelete } from "../../ui/InlineConfirmDelete";
import { PortalButton } from "../../ui/PortalButton";
import { AddTeamMembersModal } from "./AddTeamMembersModal";

type ActionResult = { ok: boolean; error?: string };

interface TeamMembersPanelProps {
  members: TeamMember[];
  candidates: AthleteSummary[];
  onAdd: (profileIds: string[]) => Promise<ActionResult>;
  onRemove: (profileId: string) => Promise<void>;
}

function athleteName(athlete: {
  first_name: string | null;
  last_name: string | null;
  username: string | null;
}): string {
  return (
    [athlete.first_name, athlete.last_name].filter(Boolean).join(" ") ||
    athlete.username ||
    "Unnamed athlete"
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function MemberNameCell({ member }: { member: TeamMember }) {
  const name = athleteName(member);
  const initial = name.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="flex items-center gap-3">
      <div className="bg-portal-orange-soft text-portal-orange flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-extrabold">
        {member.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.avatar_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          initial
        )}
      </div>
      <div>
        <div className="text-portal-text1 text-[13px] font-bold">{name}</div>
        {member.username && (
          <div className="text-portal-text3 mt-0.5 text-xs">
            @{member.username}
          </div>
        )}
      </div>
    </div>
  );
}

export function TeamMembersPanel({
  members,
  candidates,
  onAdd,
  onRemove,
}: TeamMembersPanelProps) {
  const [addOpen, setAddOpen] = useState(false);
  const memberIds = new Set(members.map((m) => m.id));
  const unassigned = candidates.filter((a) => !memberIds.has(a.id));

  return (
    <div className="border-portal-border bg-portal-card rounded-xl border">
      <div className="border-portal-border flex items-center justify-between border-b px-5 py-4">
        <h3 className="text-portal-text1 text-sm font-bold">Members</h3>
        <PortalButton
          size="sm"
          variant="primary"
          onClick={() => setAddOpen(true)}>
          Add athletes
        </PortalButton>
      </div>

      {members.length === 0 ? (
        <p className="text-portal-text3 px-5 py-4 text-xs">No members yet.</p>
      ) : (
        <div className="overflow-x-auto px-5">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-portal-border border-b">
                {["Player", "Date added"].map((h) => (
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
              {members.map((member) => (
                <tr
                  key={member.id}
                  className="border-portal-border border-b last:border-b-0">
                  <td className="py-3.5 pr-4">
                    <MemberNameCell member={member} />
                  </td>
                  <td className="text-portal-text3 py-3.5 pr-4 text-xs">
                    {formatDate(member.joined_at)}
                  </td>
                  <td className="py-3.5 pr-1">
                    <InlineConfirmDelete
                      onDelete={() => onRemove(member.id)}
                      idleTitle="Remove from team"
                      idleClassName="text-portal-text3 hover:text-red-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {addOpen && (
        <AddTeamMembersModal
          candidates={unassigned}
          onSubmit={onAdd}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  );
}
