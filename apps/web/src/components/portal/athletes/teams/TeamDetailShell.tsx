"use client";

import type {
  AthleteSummary,
  ProgramSummary,
  TeamDetail,
  TeamRow,
} from "@hooper/db";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "../../ui/PageHeader";
import { PortalButton } from "../../ui/PortalButton";
import { AssignedProgramsTable } from "../AssignedProgramsTable";
import { AssignProgramsModal } from "../AssignProgramsModal";
import { TeamEditDrawer } from "./TeamEditDrawer";
import { TeamMembersPanel } from "./TeamMembersPanel";
import { useTeamDetailForm } from "./useTeamDetailForm";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

interface TeamMembersSectionProps {
  team: TeamDetail;
  athletes: AthleteSummary[];
  onAddMembers: (profileIds: string[]) => Promise<void>;
  onRemoveMember: (profileId: string) => Promise<void>;
  onAssignClick: () => void;
  onUnassignProgram: (programId: string) => Promise<void>;
}

function TeamMembersSection({
  team,
  athletes,
  onAddMembers,
  onRemoveMember,
  onAssignClick,
  onUnassignProgram,
}: TeamMembersSectionProps) {
  return (
    <>
      <AssignedProgramsTable
        programs={team.programs}
        variant="team"
        onAssignClick={onAssignClick}
        onUnassign={onUnassignProgram}
      />

      <div className="mt-6">
        <TeamMembersPanel
          members={team.members}
          candidates={athletes}
          onAdd={onAddMembers}
          onRemove={onRemoveMember}
        />
      </div>
    </>
  );
}

function TeamDetailHeaderActions({ onEdit }: { onEdit: () => void }) {
  return (
    <div className="flex flex-col items-end gap-2">
      <Link
        href="/athletes/teams"
        className="text-portal-text2 text-xs font-semibold hover:underline">
        ← Back to teams
      </Link>
      <PortalButton variant="secondary" onClick={onEdit}>
        Edit team
      </PortalButton>
    </div>
  );
}

interface TeamDetailShellProps {
  team: TeamDetail;
  programs: ProgramSummary[];
  athletes: AthleteSummary[];
  updateTeamAction: (
    id: string,
    data: { name?: string; description?: string | null; avatar_url?: string },
  ) => Promise<ActionResult<TeamRow>>;
  deleteTeamAction: (id: string) => Promise<ActionResult>;
  addTeamMemberAction: (
    teamId: string,
    profileId: string,
  ) => Promise<ActionResult>;
  removeTeamMemberAction: (
    teamId: string,
    profileId: string,
  ) => Promise<ActionResult>;
  assignProgramAction: (
    teamId: string,
    programId: string,
  ) => Promise<ActionResult>;
  unassignProgramAction: (
    teamId: string,
    programId: string,
  ) => Promise<ActionResult>;
}

export function TeamDetailShell({
  team,
  programs,
  athletes,
  updateTeamAction,
  deleteTeamAction,
  addTeamMemberAction,
  removeTeamMemberAction,
  assignProgramAction,
  unassignProgramAction,
}: TeamDetailShellProps) {
  const router = useRouter();
  const [assignOpen, setAssignOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const {
    name,
    setName,
    description,
    setDescription,
    saving,
    uploadingAvatar,
    error,
    dirty,
    handleSave,
    handleAvatarSelected,
    handleDelete,
  } = useTeamDetailForm({ team, updateTeamAction, deleteTeamAction });

  async function handleSaveAndClose() {
    if (await handleSave()) setEditOpen(false);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title={team.name}
        subtitle={team.description ?? undefined}
        action={<TeamDetailHeaderActions onEdit={() => setEditOpen(true)} />}
      />

      <div className="flex-1 overflow-y-auto px-7 py-6">
        <TeamMembersSection
          team={team}
          athletes={athletes}
          onAddMembers={async (profileIds) => {
            await Promise.all(
              profileIds.map((profileId) =>
                addTeamMemberAction(team.id, profileId),
              ),
            );
            router.refresh();
          }}
          onRemoveMember={async (profileId) => {
            await removeTeamMemberAction(team.id, profileId);
            router.refresh();
          }}
          onAssignClick={() => setAssignOpen(true)}
          onUnassignProgram={async (programId) => {
            await unassignProgramAction(team.id, programId);
            router.refresh();
          }}
        />
      </div>

      {assignOpen && (
        <AssignProgramsModal
          entityName={team.name}
          assignedProgramIds={team.programs.map((p) => p.id)}
          allPrograms={programs}
          onAssign={(programId) => assignProgramAction(team.id, programId)}
          onUnassign={(programId) => unassignProgramAction(team.id, programId)}
          onClose={() => {
            setAssignOpen(false);
            router.refresh();
          }}
        />
      )}

      {editOpen && (
        <TeamEditDrawer
          team={team}
          name={name}
          onName={setName}
          description={description}
          onDescription={setDescription}
          saving={saving}
          uploadingAvatar={uploadingAvatar}
          error={error}
          dirty={dirty}
          onSave={handleSaveAndClose}
          onAvatarSelected={handleAvatarSelected}
          onDelete={handleDelete}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}
