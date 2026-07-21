"use client";

import { AssignedProgramsList } from "@/src/components/portal/programs/AssignedProgramsList";
import type {
  AssignmentWithProgram,
  AthleteMatch,
  TeamRow,
  TeamWithMembers,
} from "@hooper/db";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { InlineConfirmBar } from "../ui/InlineConfirmBar";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput } from "../ui/PortalInput";
import { useToast } from "../ui/Toast";
import { AddAthleteModal } from "./AddAthleteModal";
import { TeamRosterTable } from "./TeamRosterTable";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

interface TeamRosterShellProps {
  team: TeamWithMembers;
  assignments: AssignmentWithProgram[];
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
}

function TeamNameField({
  team,
  onSave,
}: {
  team: TeamRow;
  onSave: (name: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const [saving, setSaving] = useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setName(team.name);
          setEditing(true);
        }}
        title="Rename team"
        className="font-title text-portal-text1 text-[22px] font-extrabold tracking-wide hover:underline">
        {team.name}
      </button>
    );
  }

  async function handleSave() {
    if (!name.trim() || saving) return;
    setSaving(true);
    await onSave(name.trim());
    setSaving(false);
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-2">
      <PortalInput
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        className="h-9 w-64"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") setEditing(false);
        }}
      />
      <PortalButton
        size="sm"
        variant="primary"
        onClick={handleSave}
        disabled={saving || !name.trim()}>
        Save
      </PortalButton>
      <PortalButton
        size="sm"
        variant="ghost"
        onClick={() => setEditing(false)}
        disabled={saving}>
        Cancel
      </PortalButton>
    </div>
  );
}

function RosterHeader({
  team,
  memberCount,
  onRename,
  onAddClick,
}: {
  team: TeamRow;
  memberCount: number;
  onRename: (name: string) => Promise<void>;
  onAddClick: () => void;
}) {
  return (
    <div className="border-portal-border bg-portal-card flex flex-shrink-0 items-center gap-3 border-b px-7 py-6">
      <div>
        <Link
          href="/athletes"
          className="text-portal-text2 text-xs font-semibold hover:underline">
          ← Back to teams
        </Link>
        <div className="mt-1">
          <TeamNameField team={team} onSave={onRename} />
        </div>
        <p className="text-portal-text2 mt-0.5 text-sm">
          {memberCount} {memberCount === 1 ? "athlete" : "athletes"}
        </p>
      </div>
      <PortalButton variant="primary" className="ml-auto" onClick={onAddClick}>
        Add athlete
      </PortalButton>
    </div>
  );
}

function EmptyRoster({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 py-20">
      <div className="text-center">
        <p className="text-portal-text1 font-semibold">
          No athletes on this team yet
        </p>
        <p className="text-portal-text3 mt-1 text-sm">
          Add athletes by their username
        </p>
      </div>
      <PortalButton variant="primary" onClick={onAddClick}>
        Add athlete
      </PortalButton>
    </div>
  );
}

function AssignedProgramsSection({
  assignments,
  onRevoke,
}: {
  assignments: AssignmentWithProgram[];
  onRevoke: (id: string) => void | Promise<void>;
}) {
  return (
    <div className="mt-8">
      <div className="text-portal-text3 mb-2.5 text-[10px] font-bold tracking-wider uppercase">
        Assigned programs
      </div>
      <AssignedProgramsList
        assignments={assignments}
        onRevoke={onRevoke}
        emptyMessage="No programs assigned to this team yet."
      />
    </div>
  );
}

function DangerZone({
  onDelete,
  deleting,
}: {
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="mt-8 max-w-sm">
      <div className="text-portal-text3 mb-2.5 text-[10px] font-bold tracking-wider uppercase">
        Danger zone
      </div>
      <InlineConfirmBar
        idleLabel="Delete this team"
        confirmLabel="Delete this team?"
        onConfirm={onDelete}
        loading={deleting}
      />
    </div>
  );
}

export function TeamRosterShell({
  team,
  assignments,
  renameAction,
  deleteAction,
  addMemberAction,
  removeMemberAction,
  lookupAthleteAction,
  revokeAssignmentAction,
}: TeamRosterShellProps) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleRevoke(id: string) {
    const result = await revokeAssignmentAction(id);
    if (result.ok) {
      router.refresh();
    } else {
      showError(result.error ?? "Unable to revoke assignment.");
    }
  }

  async function handleRename(name: string) {
    const result = await renameAction(team.id, name);
    if (result.ok) {
      router.refresh();
    } else {
      showError(result.error ?? "Unable to rename team.");
    }
  }

  async function handleDeleteTeam() {
    setDeleting(true);
    const result = await deleteAction(team.id);
    setDeleting(false);
    if (result.ok) {
      router.push("/athletes");
    } else {
      showError(result.error ?? "Unable to delete team.");
    }
  }

  async function handleAdd(playerId: string) {
    const result = await addMemberAction(team.id, playerId);
    if (result.ok) {
      setAddOpen(false);
      showSuccess("Athlete added to team.");
      router.refresh();
    } else {
      showError(result.error ?? "Unable to add athlete.");
    }
  }

  async function handleRemove(playerId: string) {
    const result = await removeMemberAction(team.id, playerId);
    if (result.ok) {
      router.refresh();
    } else {
      showError(result.error ?? "Unable to remove athlete.");
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <RosterHeader
        team={team}
        memberCount={team.members.length}
        onRename={handleRename}
        onAddClick={() => setAddOpen(true)}
      />

      <div className="flex-1 overflow-y-auto px-7 py-4">
        {team.members.length === 0 ? (
          <EmptyRoster onAddClick={() => setAddOpen(true)} />
        ) : (
          <TeamRosterTable members={team.members} onRemove={handleRemove} />
        )}

        <AssignedProgramsSection
          assignments={assignments}
          onRevoke={handleRevoke}
        />

        <DangerZone onDelete={handleDeleteTeam} deleting={deleting} />
      </div>

      {addOpen && (
        <AddAthleteModal
          onClose={() => setAddOpen(false)}
          onLookup={lookupAthleteAction}
          onAdd={handleAdd}
          excludePlayerIds={team.members.map((m) => m.player_id)}
        />
      )}
    </div>
  );
}
