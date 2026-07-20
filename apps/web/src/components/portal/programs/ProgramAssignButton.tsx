"use client";

import type {
  AssignToPlayerInput,
  AssignToTeamInput,
} from "@/src/services/assignment.service";
import type {
  AthleteMatch,
  ProgramAssignmentRow,
  TeamSummary,
} from "@hooper/db";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PortalButton } from "../ui/PortalButton";
import { useToast } from "../ui/Toast";
import { AssignProgramModal } from "./AssignProgramModal";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

interface ProgramAssignButtonProps {
  programId: string;
  profileId: string;
  teams: TeamSummary[];
  lookupAthleteAction: (
    username: string,
  ) => Promise<ActionResult<AthleteMatch | null>>;
  assignToTeamAction: (
    input: AssignToTeamInput,
  ) => Promise<ActionResult<ProgramAssignmentRow>>;
  assignToPlayerAction: (
    input: AssignToPlayerInput,
  ) => Promise<ActionResult<ProgramAssignmentRow>>;
}

export function ProgramAssignButton({
  programId,
  profileId,
  teams,
  lookupAthleteAction,
  assignToTeamAction,
  assignToPlayerAction,
}: ProgramAssignButtonProps) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [open, setOpen] = useState(false);

  async function handleAssignToTeam(teamId: string, startDate: string) {
    const result = await assignToTeamAction({
      programId,
      teamId,
      assignedBy: profileId,
      startDate,
    });
    if (result.ok) {
      setOpen(false);
      showSuccess("Program assigned to team.");
      router.refresh();
    } else {
      showError(result.error ?? "Unable to assign program.");
    }
  }

  async function handleAssignToPlayer(playerId: string, startDate: string) {
    const result = await assignToPlayerAction({
      programId,
      playerId,
      assignedBy: profileId,
      startDate,
    });
    if (result.ok) {
      setOpen(false);
      showSuccess("Program assigned.");
      router.refresh();
    } else {
      showError(result.error ?? "Unable to assign program.");
    }
  }

  return (
    <>
      <PortalButton variant="primary" onClick={() => setOpen(true)}>
        Assign
      </PortalButton>
      {open && (
        <AssignProgramModal
          onClose={() => setOpen(false)}
          teams={teams}
          onLookupAthlete={lookupAthleteAction}
          onAssignToTeam={handleAssignToTeam}
          onAssignToPlayer={handleAssignToPlayer}
        />
      )}
    </>
  );
}
