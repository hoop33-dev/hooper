"use client";

import type {
  AssignedProgramRef,
  AthleteSummary,
  TeamDetail,
  TeamMember,
  TeamRow,
} from "@hooper/db";
import { useEffect, useState } from "react";
import { PageHeader } from "../../ui/PageHeader";
import { PortalButton } from "../../ui/PortalButton";
import { AssignedProgramsTable } from "../AssignedProgramsTable";
import { AssignProgramsModal } from "../AssignProgramsModal";
import { useLazyPrograms } from "../useLazyPrograms";
import { useProgramAssignments } from "../useProgramAssignments";
import { TeamEditSection } from "./TeamEditSection";
import { TeamMembersPanel } from "./TeamMembersPanel";
import { useTeamMembers } from "./useTeamMembers";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };
type ProgramOption = { id: string; name: string };

interface TeamMembersSectionProps {
  programs: AssignedProgramRef[];
  members: TeamMember[];
  athletes: AthleteSummary[];
  onAddMembers: (profileIds: string[]) => Promise<ActionResult>;
  onRemoveMember: (profileId: string) => Promise<void>;
  onAssignClick: () => void;
  onUnassignProgram: (programId: string) => Promise<void>;
}

function TeamMembersSection({
  programs,
  members,
  athletes,
  onAddMembers,
  onRemoveMember,
  onAssignClick,
  onUnassignProgram,
}: TeamMembersSectionProps) {
  return (
    <>
      <AssignedProgramsTable
        programs={programs}
        variant="team"
        onAssignClick={onAssignClick}
        onUnassign={onUnassignProgram}
      />

      <div className="mt-6">
        <TeamMembersPanel
          members={members}
          candidates={athletes}
          onAdd={onAddMembers}
          onRemove={onRemoveMember}
        />
      </div>
    </>
  );
}

async function addTeamMembers(
  teamId: string,
  profileIds: string[],
  addTeamMemberAction: TeamDetailShellProps["addTeamMemberAction"],
): Promise<ActionResult> {
  const results = await Promise.all(
    profileIds.map((profileId) => addTeamMemberAction(teamId, profileId)),
  );
  const failed = results.find((r) => !r.ok);
  return failed ? { ok: false, error: failed.error } : { ok: true };
}

function TeamDetailHeaderActions({ onEdit }: { onEdit: () => void }) {
  return (
    <PortalButton variant="secondary" onClick={onEdit}>
      Edit team
    </PortalButton>
  );
}

interface TeamDetailShellProps {
  team: TeamDetail;
  /** Lazily loaded when the assign modal first opens. */
  loadPrograms: () => Promise<ProgramOption[]>;
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
  loadPrograms,
  athletes,
  updateTeamAction,
  deleteTeamAction,
  addTeamMemberAction,
  removeTeamMemberAction,
  assignProgramAction,
  unassignProgramAction,
}: TeamDetailShellProps) {
  const assign = useLazyPrograms(loadPrograms);
  const [editOpen, setEditOpen] = useState(false);
  const [header, setHeader] = useState({
    name: team.name,
    description: team.description,
  });
  useEffect(() => {
    setHeader({ name: team.name, description: team.description });
  }, [team.name, team.description]);

  const { assignedPrograms, assignProgram, unassignProgram } =
    useProgramAssignments(
      team.programs,
      assign.programs,
      (programId) => assignProgramAction(team.id, programId),
      (programId) => unassignProgramAction(team.id, programId),
    );
  const { members, handleAddMembers, handleRemoveMember } = useTeamMembers(
    team.members,
    athletes,
    (profileIds) => addTeamMembers(team.id, profileIds, addTeamMemberAction),
    (profileId) => removeTeamMemberAction(team.id, profileId),
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title={header.name}
        subtitle={header.description ?? undefined}
        backHref="/athletes/teams"
        breadcrumbs={[
          { label: "Teams", href: "/athletes/teams" },
          { label: header.name },
        ]}
        action={<TeamDetailHeaderActions onEdit={() => setEditOpen(true)} />}
      />

      <div className="flex-1 overflow-y-auto px-7 py-6">
        <TeamMembersSection
          programs={assignedPrograms}
          members={members}
          athletes={athletes}
          onAddMembers={handleAddMembers}
          onRemoveMember={handleRemoveMember}
          onAssignClick={assign.open}
          onUnassignProgram={async (programId) => {
            await unassignProgram(programId);
          }}
        />
      </div>

      {assign.isOpen && (
        <AssignProgramsModal
          entityName={header.name}
          assignedProgramIds={assignedPrograms.map((p) => p.id)}
          allPrograms={assign.programs}
          loading={assign.loading}
          onAssign={assignProgram}
          onUnassign={unassignProgram}
          onClose={assign.close}
        />
      )}

      <TeamEditSection
        team={team}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onOptimisticSave={setHeader}
        updateTeamAction={updateTeamAction}
        deleteTeamAction={deleteTeamAction}
      />
    </div>
  );
}
