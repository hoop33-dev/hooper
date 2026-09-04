"use client";

import type { AthleteSummary, TeamMember } from "@hooper/db";
import { useOptimisticList } from "../../ui/useOptimisticList";

type ActionResult = { ok: boolean; error?: string };

/** Optimistic team-member list: a just-added athlete shows in the panel
 * straight away (synthesized from the candidate row, `joined_at` = now) and a
 * removed one disappears at once, rather than after the add/remove modal's
 * close-then-refresh (see router-refresh-modal-gap). */
export function useTeamMembers(
  initial: TeamMember[],
  candidates: AthleteSummary[],
  addMembers: (profileIds: string[]) => Promise<ActionResult>,
  removeMember: (profileId: string) => Promise<ActionResult>,
) {
  const { items: members, mutate } = useOptimisticList(initial);

  async function handleAddMembers(profileIds: string[]): Promise<ActionResult> {
    const now = new Date().toISOString();
    const additions = candidates
      .filter((a) => profileIds.includes(a.id))
      .map((a): TeamMember => ({ ...a, joined_at: now }));
    return mutate(
      (prev) => [
        ...prev,
        ...additions.filter((a) => !prev.some((m) => m.id === a.id)),
      ],
      () => addMembers(profileIds),
    );
  }

  async function handleRemoveMember(profileId: string): Promise<void> {
    await mutate(
      (prev) => prev.filter((m) => m.id !== profileId),
      () => removeMember(profileId),
    );
  }

  return { members, handleAddMembers, handleRemoveMember };
}
