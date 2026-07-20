"use client";

import type { AthleteMatch } from "@hooper/db";
import { useState } from "react";
import { ModalHeader } from "../ui/ModalHeader";
import { PortalButton } from "../ui/PortalButton";
import { useModalDismiss } from "../ui/useModalDismiss";
import { AthleteUsernameSearch } from "./AthleteUsernameSearch";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

interface AddAthleteModalProps {
  onClose: () => void;
  onLookup: (username: string) => Promise<ActionResult<AthleteMatch | null>>;
  onAdd: (playerId: string) => Promise<void>;
  /** Skip matches already on this team, so a coach can't "find" someone the
   * search already turned up as a duplicate. */
  excludePlayerIds?: string[];
}

export function AddAthleteModal({
  onClose,
  onLookup,
  onAdd,
  excludePlayerIds = [],
}: AddAthleteModalProps) {
  const [match, setMatch] = useState<AthleteMatch | null | undefined>(
    undefined,
  );
  const [adding, setAdding] = useState(false);
  const onBackdropClick = useModalDismiss(onClose);

  const alreadyOnTeam = match ? excludePlayerIds.includes(match.id) : false;

  async function handleAdd() {
    if (!match || adding || alreadyOnTeam) return;
    setAdding(true);
    await onAdd(match.id);
    setAdding(false);
  }

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-portal-card w-full max-w-md rounded-2xl shadow-2xl">
        <ModalHeader title="Add athlete" onClose={onClose} />

        <div className="flex flex-col gap-4 px-6 py-5">
          <p className="text-portal-text3 text-xs">
            Search by the athlete&apos;s exact username to add them.
          </p>
          <AthleteUsernameSearch
            onLookup={onLookup}
            match={match}
            onMatchChange={setMatch}
            disabledIds={excludePlayerIds}
          />
        </div>

        <div className="border-portal-border flex justify-end gap-2 border-t px-6 py-4">
          <PortalButton variant="ghost" onClick={onClose} disabled={adding}>
            Cancel
          </PortalButton>
          <PortalButton
            variant="primary"
            onClick={handleAdd}
            disabled={!match || alreadyOnTeam || adding}>
            {adding ? "Adding…" : "Add to team"}
          </PortalButton>
        </div>
      </div>
    </div>
  );
}
