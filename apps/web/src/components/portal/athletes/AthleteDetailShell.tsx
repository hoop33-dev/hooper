"use client";

import {
  mergeAthletePrograms,
  type AthleteProgramEntry,
} from "@/src/lib/athletePrograms";
import { formatProgramSub, formatShortDate, plural } from "@/src/lib/format";
import type {
  AssignedProgramRef,
  AthleteDetail,
  ProgramProgressStats,
  ProgramSummary,
  TeamSummary,
} from "@hooper/db";
import { useMemo, useState } from "react";
import {
  DetailError,
  DetailListCard,
  DetailRow,
  RemoveButton,
  detailCardClass,
} from "../ui/DetailListCard";
import { UsersIcon } from "../ui/icons";
import { LetterTile } from "../ui/LetterTile";
import { PageHeader } from "../ui/PageHeader";
import {
  SearchPickerModal,
  type SearchPickerItem,
} from "../ui/SearchPickerModal";
import { useOptimisticDetail } from "../ui/useOptimisticDetail";
import { AthleteAvatar, TeamTile, athleteName } from "./AthleteAvatar";

type ActionResult = { ok: boolean; error?: string };
type Picker = "program" | "team" | null;

type AthleteDetailActions = {
  assignProgramAction: (
    profileId: string,
    programId: string,
  ) => Promise<ActionResult>;
  unassignProgramAction: (
    profileId: string,
    programId: string,
  ) => Promise<ActionResult>;
  addToTeamAction: (profileId: string, teamId: string) => Promise<ActionResult>;
  removeFromTeamAction: (
    profileId: string,
    teamId: string,
  ) => Promise<ActionResult>;
};

type AthleteLinks = { programs: AssignedProgramRef[]; teams: TeamSummary[] };

/** Direct programs + team memberships, edited optimistically. Adding a team
 * pulls its programs in from the `allTeams` row straight away. */
function useAthleteLinks(
  athlete: AthleteDetail,
  teams: TeamSummary[],
  allPrograms: ProgramSummary[],
  allTeams: TeamSummary[],
  actions: AthleteDetailActions,
) {
  const server = useMemo(
    () => ({ programs: athlete.programs, teams }),
    [athlete.programs, teams],
  );
  const { local, error, mutate } = useOptimisticDetail<AthleteLinks>(server);
  const id = athlete.id;

  return {
    local,
    error,
    assignProgram: async (programId: string) => {
      const program = allPrograms.find((p) => p.id === programId);
      if (!program) return { ok: false, error: "Program not found." };
      const ref = { id: program.id, name: program.name };
      return mutate(
        (prev) => ({ ...prev, programs: [...prev.programs, ref] }),
        () => actions.assignProgramAction(id, programId),
      );
    },
    unassignProgram: (programId: string) =>
      void mutate(
        (prev) => ({
          ...prev,
          programs: prev.programs.filter((p) => p.id !== programId),
        }),
        () => actions.unassignProgramAction(id, programId),
      ),
    addTeam: async (teamId: string) => {
      const team = allTeams.find((t) => t.id === teamId);
      if (!team) return { ok: false, error: "Team not found." };
      const joined = { ...team, memberCount: team.memberCount + 1 };
      return mutate(
        (prev) => ({ ...prev, teams: [...prev.teams, joined] }),
        () => actions.addToTeamAction(id, teamId),
      );
    },
    removeTeam: (teamId: string) =>
      void mutate(
        (prev) => ({
          ...prev,
          teams: prev.teams.filter((t) => t.id !== teamId),
        }),
        () => actions.removeFromTeamAction(id, teamId),
      ),
  };
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-portal-text3 text-[11px] font-semibold tracking-widest uppercase">
        {label}
      </div>
      <div className="text-portal-text1 mt-1 text-sm">{value}</div>
    </div>
  );
}

function ProfileCard({ athlete }: { athlete: AthleteDetail }) {
  const fields = [
    [
      "Date of birth",
      athlete.date_of_birth && formatShortDate(athlete.date_of_birth),
    ],
    ["Mobile", athlete.mobile],
    ["Location", athlete.regionName],
    ["Bio", athlete.bio],
  ].filter((f): f is [string, string] => !!f[1]);

  return (
    <div className={detailCardClass}>
      <div className="flex items-center gap-3.5 p-5">
        <AthleteAvatar profile={athlete} size={56} />
        <div className="min-w-0">
          <div className="text-portal-text1 truncate text-[15px] font-bold">
            {athleteName(athlete)}
          </div>
          {athlete.username && (
            <div className="text-portal-text3 mt-0.5 text-xs">
              @{athlete.username}
            </div>
          )}
        </div>
      </div>
      {fields.length > 0 && (
        <div className="border-portal-border flex flex-col gap-4 border-t p-5">
          {fields.map(([label, value]) => (
            <ProfileField key={label} label={label} value={value} />
          ))}
        </div>
      )}
    </div>
  );
}

function TeamBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-[rgba(0,71,186,0.09)] px-[7px] py-px text-[10px] font-bold tracking-[0.06em] text-[#0047BA] uppercase">
      <UsersIcon size={10} />
      <span className="truncate">{name}</span>
    </span>
  );
}

function progressLabel(stats: ProgramProgressStats | undefined): string {
  if (!stats || stats.sessionsComplete === 0) return "Not started";
  return [
    stats.week !== null ? `Week ${stats.week}` : null,
    `${plural(stats.sessionsComplete, "session")} done`,
    stats.lastCompletedAt
      ? `last ${formatShortDate(stats.lastCompletedAt)}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function ProgramRow({
  entry,
  stats,
  onRemove,
}: {
  entry: AthleteProgramEntry;
  stats: ProgramProgressStats | undefined;
  onRemove: () => void;
}) {
  return (
    <DetailRow
      lead={<LetterTile name={entry.name} />}
      title={entry.name}
      sub={
        <>
          <span className="flex-shrink-0">{progressLabel(stats)}</span>
          {entry.viaTeam && <TeamBadge name={entry.viaTeam} />}
        </>
      }
      trail={
        entry.viaTeam ? (
          <span className="text-portal-text3 text-[11px] whitespace-nowrap">
            Via team
          </span>
        ) : (
          <RemoveButton label={entry.name} onClick={onRemove} />
        )
      }
    />
  );
}

function AthletePickers({
  picker,
  athleteLabel,
  programItems,
  teamItems,
  links,
  onClose,
}: {
  picker: Picker;
  athleteLabel: string;
  programItems: SearchPickerItem[];
  teamItems: SearchPickerItem[];
  links: ReturnType<typeof useAthleteLinks>;
  onClose: () => void;
}) {
  if (picker === "program") {
    return (
      <SearchPickerModal
        title="Assign program"
        subtitle={athleteLabel}
        placeholder="Search programs…"
        items={programItems}
        emptyLabel="All programs are already assigned."
        onAdd={links.assignProgram}
        onClose={onClose}
      />
    );
  }
  if (picker === "team") {
    return (
      <SearchPickerModal
        title="Add to team"
        subtitle={athleteLabel}
        placeholder="Search teams…"
        items={teamItems}
        emptyLabel="Already on every team."
        onAdd={links.addTeam}
        onClose={onClose}
      />
    );
  }
  return null;
}

function headerSubtitle(
  athlete: AthleteDetail,
  programCount: number,
  teamCount: number,
): string {
  const handle = athlete.username ? `@${athlete.username} · ` : "";
  const lastLogin = athlete.last_sign_in_at
    ? formatShortDate(athlete.last_sign_in_at)
    : "never";
  return `${handle}${plural(programCount, "program")} and ${plural(teamCount, "team")}. Last login ${lastLogin}`;
}

/** Picker candidates: programs the athlete doesn't already see (directly or
 * via a team) and teams they're not on. */
function pickerItems(
  allPrograms: ProgramSummary[],
  allTeams: TeamSummary[],
  programIds: Set<string>,
  teamIds: Set<string>,
): { programItems: SearchPickerItem[]; teamItems: SearchPickerItem[] } {
  return {
    programItems: allPrograms
      .filter((p) => !programIds.has(p.id))
      .map((p) => ({
        id: p.id,
        title: p.name,
        sub: formatProgramSub(p),
        lead: <LetterTile name={p.name} />,
      })),
    teamItems: allTeams
      .filter((t) => !teamIds.has(t.id))
      .map((t) => ({
        id: t.id,
        title: t.name,
        sub: `${plural(t.memberCount, "athlete")} · ${plural(t.programs.length, "program")}`,
        lead: <TeamTile team={t} />,
      })),
  };
}

export function AthleteDetailShell({
  athlete,
  teams,
  allPrograms,
  allTeams,
  programStats,
  ...actions
}: AthleteDetailActions & {
  athlete: AthleteDetail;
  /** Teams this athlete is on. */
  teams: TeamSummary[];
  allPrograms: ProgramSummary[];
  allTeams: TeamSummary[];
  /** Per-program progress keyed by program id — see
   * `getAthleteProgramProgress`. */
  programStats: Record<string, ProgramProgressStats>;
}) {
  const links = useAthleteLinks(athlete, teams, allPrograms, allTeams, actions);
  const [picker, setPicker] = useState<Picker>(null);
  const name = athleteName(athlete);
  const programs = mergeAthletePrograms(
    links.local.programs,
    links.local.teams,
  );

  const { programItems, teamItems } = pickerItems(
    allPrograms,
    allTeams,
    new Set(programs.map((p) => p.id)),
    new Set(links.local.teams.map((t) => t.id)),
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title={name}
        subtitle={headerSubtitle(
          athlete,
          programs.length,
          links.local.teams.length,
        )}
        backHref="/athletes"
        breadcrumbs={[
          { label: "Athletes", href: "/athletes" },
          { label: name },
        ]}
      />

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-7">
        <DetailError error={links.error} />
        <div className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="flex flex-col gap-5">
            <ProfileCard athlete={athlete} />
            <DetailListCard
              title="Teams"
              count={links.local.teams.length}
              onAdd={() => setPicker("team")}
              emptyLabel="Not on any teams."
              emptyCta="Add to team">
              {links.local.teams.map((t) => (
                <DetailRow
                  key={t.id}
                  lead={<TeamTile team={t} size={34} />}
                  title={t.name}
                  sub={plural(t.memberCount, "athlete")}
                  trail={
                    <RemoveButton
                      label={t.name}
                      onClick={() => links.removeTeam(t.id)}
                    />
                  }
                />
              ))}
            </DetailListCard>
          </div>

          <DetailListCard
            title="Programs"
            count={programs.length}
            onAdd={() => setPicker("program")}
            addLabel="Assign"
            emptyLabel="No programs assigned."
            emptyCta="Assign program">
            {programs.map((entry) => (
              <ProgramRow
                key={entry.id}
                entry={entry}
                stats={programStats[entry.id]}
                onRemove={() => links.unassignProgram(entry.id)}
              />
            ))}
          </DetailListCard>
        </div>
      </div>

      <AthletePickers
        picker={picker}
        athleteLabel={name}
        programItems={programItems}
        teamItems={teamItems}
        links={links}
        onClose={() => setPicker(null)}
      />
    </div>
  );
}
