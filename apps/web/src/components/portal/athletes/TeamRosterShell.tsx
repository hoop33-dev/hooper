"use client";

import { AssignedProgramsList } from "@/src/components/portal/programs/AssignedProgramsList";
import { AssignProgramPickerModal } from "@/src/components/portal/programs/AssignProgramPickerModal";
import type { AssignToTeamInput } from "@/src/services/assignment.service";
import type {
  AssignmentWithProgram,
  AthleteMatch,
  ProgramAssignmentRow,
  ProgramSummary,
  TeamRow,
  TeamWithMembers,
} from "@hooper/db";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { PortalButton } from "../ui/PortalButton";
import { useToast } from "../ui/Toast";
import { AddAthleteModal } from "./AddAthleteModal";
import { TeamEditDrawer } from "./TeamEditDrawer";
import { TeamRosterTable } from "./TeamRosterTable";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

interface TeamRosterShellProps {
  team: TeamWithMembers;
  assignments: AssignmentWithProgram[];
  programs: ProgramSummary[];
  profileId: string;
  renameAction: (id: string, name: string) => Promise<ActionResult<TeamRow>>;
  deleteAction: (id: string) => Promise<ActionResult>;
  addMemberAction: (teamId: string, playerId: string) => Promise<ActionResult>;
  removeMemberAction: (
    teamId: string,
    playerId: string,
  ) => Promise<ActionResult>;
  lookupAthleteAction: (
    username: string,
  ) => Promise<ActionResult<AthleteMatch | null>>;
  revokeAssignmentAction: (id: string) => Promise<ActionResult>;
  assignToTeamAction: (
    input: AssignToTeamInput,
  ) => Promise<ActionResult<ProgramAssignmentRow>>;
}

function RosterHeader({
  team,
  memberCount,
  onEditClick,
}: {
  team: TeamRow;
  memberCount: number;
  onEditClick: () => void;
}) {
  return (
    <div className="border-portal-border bg-portal-card flex flex-shrink-0 items-center gap-3 border-b px-7 py-6">
      <div>
        <Link
          href="/athletes"
          className="text-portal-text2 text-xs font-semibold hover:underline">
          ← Back to teams
        </Link>
        <h1 className="font-title text-portal-text1 mt-1 text-[22px] font-extrabold tracking-wide">
          {team.name}
        </h1>
        <p className="text-portal-text2 mt-0.5 text-sm">
          {memberCount} {memberCount === 1 ? "athlete" : "athletes"}
        </p>
      </div>
      <PortalButton
        variant="secondary"
        className="ml-auto"
        onClick={onEditClick}>
        Edit
      </PortalButton>
    </div>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="border-portal-border bg-portal-card overflow-hidden rounded-xl border">
      <div className="border-portal-border flex items-center justify-between border-b px-5 py-3">
        <h2 className="text-portal-text1 text-sm font-bold">{title}</h2>
        {action}
      </div>
      <div className="px-5">{children}</div>
    </div>
  );
}

function EmptyRoster({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <p className="text-portal-text1 text-sm font-semibold">
        No athletes on this team yet
      </p>
      <PortalButton size="sm" variant="primary" onClick={onAddClick}>
        Add athlete
      </PortalButton>
    </div>
  );
}

function RosterPanels({
  team,
  assignments,
  onRemove,
  onRevoke,
  onAddClick,
  onAssignClick,
}: {
  team: TeamWithMembers;
  assignments: AssignmentWithProgram[];
  onRemove: (playerId: string) => void;
  onRevoke: (id: string) => void;
  onAddClick: () => void;
  onAssignClick: () => void;
}) {
  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.5fr_1fr]">
      <Panel
        title={`Athletes (${team.members.length})`}
        action={
          <PortalButton size="sm" variant="secondary" onClick={onAddClick}>
            + Add athlete
          </PortalButton>
        }>
        {team.members.length === 0 ? (
          <EmptyRoster onAddClick={onAddClick} />
        ) : (
          <TeamRosterTable members={team.members} onRemove={onRemove} />
        )}
      </Panel>

      <Panel
        title={`Programs (${assignments.length})`}
        action={
          <PortalButton size="sm" variant="secondary" onClick={onAssignClick}>
            + Assign
          </PortalButton>
        }>
        <AssignedProgramsList
          assignments={assignments}
          onRevoke={onRevoke}
          emptyMessage="No programs assigned to this team yet."
        />
      </Panel>
    </div>
  );
}

function RosterModals({
  team,
  addOpen,
  onAddClose,
  onAdd,
  lookupAthleteAction,
  editOpen,
  onEditClose,
  onRename,
  onDelete,
  assignOpen,
  onAssignClose,
  programs,
  onAssignProgram,
}: {
  team: TeamWithMembers;
  addOpen: boolean;
  onAddClose: () => void;
  onAdd: (playerId: string) => Promise<void>;
  lookupAthleteAction: (
    username: string,
  ) => Promise<ActionResult<AthleteMatch | null>>;
  editOpen: boolean;
  onEditClose: () => void;
  onRename: (name: string) => Promise<void>;
  onDelete: () => Promise<void>;
  assignOpen: boolean;
  onAssignClose: () => void;
  programs: ProgramSummary[];
  onAssignProgram: (programId: string, startDate: string) => Promise<void>;
}) {
  return (
    <>
      {addOpen && (
        <AddAthleteModal
          onClose={onAddClose}
          onLookup={lookupAthleteAction}
          onAdd={onAdd}
          excludePlayerIds={team.members.map((m) => m.player_id)}
        />
      )}

      {editOpen && (
        <TeamEditDrawer
          team={team}
          onClose={onEditClose}
          onSave={onRename}
          onDelete={onDelete}
        />
      )}

      {assignOpen && (
        <AssignProgramPickerModal
          title={`Assign a program to ${team.name}`}
          programs={programs}
          onClose={onAssignClose}
          onAssign={onAssignProgram}
        />
      )}
    </>
  );
}

function applyResult<T>(
  result: ActionResult<T>,
  showError: (message: string) => void,
  fallbackError: string,
  onSuccess: () => void,
) {
  if (result.ok) {
    onSuccess();
  } else {
    showError(result.error ?? fallbackError);
  }
}

export function TeamRosterShell({
  team,
  assignments,
  programs,
  profileId,
  renameAction,
  deleteAction,
  addMemberAction,
  removeMemberAction,
  lookupAthleteAction,
  revokeAssignmentAction,
  assignToTeamAction,
}: TeamRosterShellProps) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  async function handleRevoke(id: string) {
    const result = await revokeAssignmentAction(id);
    applyResult(result, showError, "Unable to revoke assignment.", () =>
      router.refresh(),
    );
  }

  async function handleRename(name: string) {
    const result = await renameAction(team.id, name);
    applyResult(result, showError, "Unable to rename team.", () => {
      setEditOpen(false);
      router.refresh();
    });
  }

  async function handleDeleteTeam() {
    const result = await deleteAction(team.id);
    applyResult(result, showError, "Unable to delete team.", () =>
      router.push("/athletes"),
    );
  }

  async function handleAdd(playerId: string) {
    const result = await addMemberAction(team.id, playerId);
    applyResult(result, showError, "Unable to add athlete.", () => {
      setAddOpen(false);
      showSuccess("Athlete added to team.");
      router.refresh();
    });
  }

  async function handleRemove(playerId: string) {
    const result = await removeMemberAction(team.id, playerId);
    applyResult(result, showError, "Unable to remove athlete.", () =>
      router.refresh(),
    );
  }

  async function handleAssignProgram(programId: string, startDate: string) {
    const result = await assignToTeamAction({
      programId,
      teamId: team.id,
      assignedBy: profileId,
      startDate,
    });
    applyResult(result, showError, "Unable to assign program.", () => {
      setAssignOpen(false);
      showSuccess("Program assigned.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <RosterHeader
        team={team}
        memberCount={team.members.length}
        onEditClick={() => setEditOpen(true)}
      />

      <div className="flex-1 overflow-y-auto px-7 py-4">
        <RosterPanels
          team={team}
          assignments={assignments}
          onRemove={handleRemove}
          onRevoke={handleRevoke}
          onAddClick={() => setAddOpen(true)}
          onAssignClick={() => setAssignOpen(true)}
        />
      </div>

      <RosterModals
        team={team}
        addOpen={addOpen}
        onAddClose={() => setAddOpen(false)}
        onAdd={handleAdd}
        lookupAthleteAction={lookupAthleteAction}
        editOpen={editOpen}
        onEditClose={() => setEditOpen(false)}
        onRename={handleRename}
        onDelete={handleDeleteTeam}
        assignOpen={assignOpen}
        onAssignClose={() => setAssignOpen(false)}
        programs={programs}
        onAssignProgram={handleAssignProgram}
      />
    </div>
  );
}
