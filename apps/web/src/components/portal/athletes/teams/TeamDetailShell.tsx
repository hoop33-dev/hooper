"use client";

import { formatProgramSub, formatShortDate, plural } from "@/src/lib/format";
import type {
  AssignedProgramRef,
  AthleteSummary,
  ProgramSummary,
  TeamDetail,
  TeamMember,
  TeamRow,
} from "@hooper/db";
import { useEffect, useMemo, useState } from "react";
import {
  DetailError,
  DetailListCard,
  DetailRow,
  RemoveButton,
} from "../../ui/DetailListCard";
import { LetterTile } from "../../ui/LetterTile";
import { PageHeader } from "../../ui/PageHeader";
import { PortalButton } from "../../ui/PortalButton";
import {
  SearchPickerModal,
  type SearchPickerItem,
} from "../../ui/SearchPickerModal";
import { useOptimisticDetail } from "../../ui/useOptimisticDetail";
import { AthleteAvatar, athleteName } from "../AthleteAvatar";
import { TeamEditSection } from "./TeamEditSection";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };
type Picker = "athlete" | "program" | null;

type TeamDetailActions = {
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
};

type TeamLinks = { members: TeamMember[]; programs: AssignedProgramRef[] };

/** Members + programs, edited optimistically. A new member is synthesized
 * from their athletes-list row (`joined_at` = now) until the refresh lands. */
function useTeamLinks(
  team: TeamDetail,
  athletes: AthleteSummary[],
  allPrograms: ProgramSummary[],
  actions: TeamDetailActions,
) {
  const server = useMemo(
    () => ({ members: team.members, programs: team.programs }),
    [team.members, team.programs],
  );
  const { local, error, mutate } = useOptimisticDetail<TeamLinks>(server);
  const id = team.id;

  return {
    local,
    error,
    addMember: async (profileId: string) => {
      const athlete = athletes.find((a) => a.id === profileId);
      if (!athlete) return { ok: false, error: "Athlete not found." };
      const member: TeamMember = {
        ...athlete,
        joined_at: new Date().toISOString(),
      };
      return mutate(
        (prev) => ({ ...prev, members: [...prev.members, member] }),
        () => actions.addTeamMemberAction(id, profileId),
      );
    },
    removeMember: (profileId: string) =>
      void mutate(
        (prev) => ({
          ...prev,
          members: prev.members.filter((m) => m.id !== profileId),
        }),
        () => actions.removeTeamMemberAction(id, profileId),
      ),
    addProgram: async (programId: string) => {
      const program = allPrograms.find((p) => p.id === programId);
      if (!program) return { ok: false, error: "Program not found." };
      const ref = { id: program.id, name: program.name };
      return mutate(
        (prev) => ({ ...prev, programs: [...prev.programs, ref] }),
        () => actions.assignProgramAction(id, programId),
      );
    },
    removeProgram: (programId: string) =>
      void mutate(
        (prev) => ({
          ...prev,
          programs: prev.programs.filter((p) => p.id !== programId),
        }),
        () => actions.unassignProgramAction(id, programId),
      ),
  };
}

type TeamLinksState = ReturnType<typeof useTeamLinks>;

function memberSub(member: {
  username: string | null;
  last_sign_in_at: string | null;
}): string {
  const lastLogin = member.last_sign_in_at
    ? `last login ${formatShortDate(member.last_sign_in_at)}`
    : "never logged in";
  return member.username ? `@${member.username} · ${lastLogin}` : lastLogin;
}

function TeamCards({
  links,
  programsById,
  onOpen,
}: {
  links: TeamLinksState;
  programsById: Map<string, ProgramSummary>;
  onOpen: (picker: Picker) => void;
}) {
  const { members, programs } = links.local;
  const assignedTo = `assigned to all ${plural(members.length, "athlete")}`;
  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <DetailListCard
        title="Athletes"
        count={members.length}
        onAdd={() => onOpen("athlete")}
        emptyLabel="No athletes on this team."
        emptyCta="Add athlete">
        {members.map((m) => (
          <DetailRow
            key={m.id}
            href={`/athletes/${m.id}`}
            lead={<AthleteAvatar profile={m} />}
            title={athleteName(m)}
            sub={memberSub(m)}
            trail={
              <RemoveButton
                label={athleteName(m)}
                onClick={() => links.removeMember(m.id)}
              />
            }
          />
        ))}
      </DetailListCard>
      <DetailListCard
        title="Programs"
        count={programs.length}
        onAdd={() => onOpen("program")}
        emptyLabel="No programs on this team."
        emptyCta="Add program">
        {programs.map((p) => {
          const summary = programsById.get(p.id);
          return (
            <DetailRow
              key={p.id}
              href={`/programs/${p.id}`}
              lead={<LetterTile name={p.name} />}
              title={p.name}
              sub={
                summary
                  ? `${formatProgramSub(summary)} · ${assignedTo}`
                  : assignedTo
              }
              trail={
                <RemoveButton
                  label={p.name}
                  onClick={() => links.removeProgram(p.id)}
                />
              }
            />
          );
        })}
      </DetailListCard>
    </div>
  );
}

function TeamPickers({
  picker,
  teamName,
  links,
  athletes,
  allPrograms,
  onClose,
}: {
  picker: Picker;
  teamName: string;
  links: TeamLinksState;
  athletes: AthleteSummary[];
  allPrograms: ProgramSummary[];
  onClose: () => void;
}) {
  if (picker === "athlete") {
    const memberIds = new Set(links.local.members.map((m) => m.id));
    const items: SearchPickerItem[] = athletes
      .filter((a) => !memberIds.has(a.id))
      .map((a) => ({
        id: a.id,
        title: athleteName(a),
        sub: a.username ? `@${a.username}` : undefined,
        search: a.username ?? undefined,
        lead: <AthleteAvatar profile={a} />,
      }));
    return (
      <SearchPickerModal
        title="Add athlete"
        subtitle={teamName}
        placeholder="Search athletes by name or username…"
        items={items}
        emptyLabel="Every athlete is already on this team."
        onAdd={links.addMember}
        onClose={onClose}
      />
    );
  }
  if (picker === "program") {
    const programIds = new Set(links.local.programs.map((p) => p.id));
    const items: SearchPickerItem[] = allPrograms
      .filter((p) => !programIds.has(p.id))
      .map((p) => ({
        id: p.id,
        title: p.name,
        sub: formatProgramSub(p),
        lead: <LetterTile name={p.name} />,
      }));
    return (
      <SearchPickerModal
        title="Add program"
        subtitle={teamName}
        placeholder="Search programs…"
        items={items}
        emptyLabel="All programs are already on this team."
        onAdd={links.addProgram}
        onClose={onClose}
      />
    );
  }
  return null;
}

export function TeamDetailShell({
  team,
  athletes,
  allPrograms,
  ...actions
}: TeamDetailActions & {
  team: TeamDetail;
  /** Candidates for "Add athlete". */
  athletes: AthleteSummary[];
  allPrograms: ProgramSummary[];
}) {
  const links = useTeamLinks(team, athletes, allPrograms, actions);
  const [picker, setPicker] = useState<Picker>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [header, setHeader] = useState({
    name: team.name,
    description: team.description,
  });
  useEffect(() => {
    setHeader({ name: team.name, description: team.description });
  }, [team.name, team.description]);

  const programsById = useMemo(
    () => new Map(allPrograms.map((p) => [p.id, p])),
    [allPrograms],
  );
  const { members, programs } = links.local;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title={header.name}
        subtitle={`${plural(members.length, "athlete")} and ${plural(programs.length, "program")}. Created ${formatShortDate(team.created_at)}`}
        backHref="/teams"
        breadcrumbs={[
          { label: "Teams", href: "/teams" },
          { label: header.name },
        ]}
        action={
          <PortalButton variant="secondary" onClick={() => setEditOpen(true)}>
            Edit team
          </PortalButton>
        }
      />

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-7">
        <DetailError error={links.error} />
        <TeamCards
          links={links}
          programsById={programsById}
          onOpen={setPicker}
        />
      </div>

      <TeamPickers
        picker={picker}
        teamName={header.name}
        links={links}
        athletes={athletes}
        allPrograms={allPrograms}
        onClose={() => setPicker(null)}
      />

      <TeamEditSection
        team={team}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onOptimisticSave={setHeader}
        updateTeamAction={actions.updateTeamAction}
        deleteTeamAction={actions.deleteTeamAction}
      />
    </div>
  );
}
