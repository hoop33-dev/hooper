"use client";

import { mergeAthletePrograms } from "@/src/lib/athletePrograms";
import { formatProgramSub, formatShortDate, plural } from "@/src/lib/format";
import type {
  AthleteAccount,
  AthletePackage,
  AthleteProfileFields,
} from "@/src/services/athlete.service";
import type {
  AssignedProgramRef,
  AthleteDetail,
  AthletePackageProgram,
  AthleteTeam,
  ProgramSummary,
  TeamSummary,
} from "@hooper/db";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { withManual, withoutManual } from "../packages/ViaPackage";
import { MailIcon, PlusIcon, UsersIcon } from "../ui/icons";
import { LetterTile } from "../ui/LetterTile";
import { PageHeader } from "../ui/PageHeader";
import { PortalButton } from "../ui/PortalButton";
import {
  SearchPickerModal,
  type SearchPickerItem,
} from "../ui/SearchPickerModal";
import { useToast } from "../ui/Toast";
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
  sendPasswordResetAction: (profileId: string) => Promise<ActionResult>;
  updateProfileAction: (
    profileId: string,
    fields: AthleteProfileFields,
  ) => Promise<ActionResult>;
};

type AthleteLinks = { programs: AssignedProgramRef[]; teams: AthleteTeam[] };

/** Direct programs + team memberships, edited optimistically. Adding a team
 * pulls its programs in from the `allTeams` row straight away. */
function useAthleteLinks(
  athlete: AthleteDetail,
  teams: AthleteTeam[],
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
      const joined: AthleteTeam = {
        ...team,
        memberCount: team.memberCount + 1,
        via: { manual: true, packages: [] },
      };
      return mutate(
        (prev) => ({
          ...prev,
          teams: withManual(prev.teams, (t) => t.id === teamId, joined),
        }),
        () => actions.addToTeamAction(id, teamId),
      );
    },
    removeTeam: (teamId: string) =>
      void mutate(
        (prev) => ({
          ...prev,
          teams: withoutManual(prev.teams, (t) => t.id === teamId),
        }),
        () => actions.removeFromTeamAction(id, teamId),
      ),
  };
}

/** The athlete's profile, edited optimistically: the header and Details
 * tab show a save straight away, then the refresh brings the server's
 * copy (normalised username, trimmed fields). */
function useAthleteProfile(
  athlete: AthleteDetail,
  action: AthleteDetailActions["updateProfileAction"],
) {
  const { local, mutate } = useOptimisticDetail(athlete);
  return {
    local,
    save: (fields: AthleteProfileFields) =>
      mutate(
        (prev) => ({
          ...prev,
          first_name: fields.firstName,
          last_name: fields.lastName,
          username: fields.username,
          mobile: fields.mobile,
          date_of_birth: fields.dateOfBirth,
          region_id: fields.regionId,
          bio: fields.bio,
        }),
        () => action(athlete.id, fields),
      ),
  };
}

/** Sends the athlete a reset link, toasting the outcome. Child accounts
 * can't — their parent sets the password. */
function usePasswordReset(
  athleteId: string,
  account: AthleteAccount | null,
  action: AthleteDetailActions["sendPasswordResetAction"],
) {
  const toast = useToast();
  const [sending, setSending] = useState(false);
  const blockedReason = !account
    ? "Account details couldn't be loaded."
    : !account.hasRealEmail
      ? account.parentName
        ? `Child account: ${account.parentName} sets their password.`
        : "Child account: their parent sets their password."
      : null;

  return {
    sending,
    blockedReason,
    send: async () => {
      if (sending || blockedReason) return;
      setSending(true);
      const result = await action(athleteId);
      setSending(false);
      if (result.ok) {
        toast.showSuccess(`Password reset sent to ${account?.email}`);
      } else {
        toast.showError(result.error ?? "Couldn't send the reset email.");
      }
    },
  };
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
  counts: { programs: number; teams: number; packages: number },
): string {
  const handle = athlete.username ? `@${athlete.username}, ` : "";
  const lastLogin = athlete.last_sign_in_at
    ? formatShortDate(athlete.last_sign_in_at)
    : "never";
  return `${handle}${plural(counts.programs, "program")}, ${plural(counts.teams, "team")}, ${plural(counts.packages, "package")}. Last login ${lastLogin}`;
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

function actionTab(pathname: string, basePath: string) {
  if (pathname === basePath) return "training";
  if (pathname === `${basePath}/details`) return "details";
  return null;
}

/** The tab row's buttons: assign/add on Programs & teams, the password
 * reset on Details, nothing on Billing. */
function AthleteTabAction({
  tab,
  onPick,
  passwordReset,
}: {
  tab: "training" | "details" | null;
  onPick: (picker: Exclude<Picker, null>) => void;
  passwordReset: ReturnType<typeof usePasswordReset>;
}) {
  if (tab === "training") {
    return (
      <div className="flex gap-2">
        <PortalButton onClick={() => onPick("team")}>
          <UsersIcon size={14} /> Add to team
        </PortalButton>
        <PortalButton variant="primary" onClick={() => onPick("program")}>
          <PlusIcon size={14} /> Assign program
        </PortalButton>
      </div>
    );
  }
  if (tab === "details") {
    return (
      <PortalButton
        onClick={passwordReset.send}
        disabled={passwordReset.sending || !!passwordReset.blockedReason}
        title={passwordReset.blockedReason ?? undefined}>
        <MailIcon size={14} />
        {passwordReset.sending ? "Sending…" : "Send password reset"}
      </PortalButton>
    );
  }
  return null;
}

/** Avatar, name, counts and the tab strip. */
function AthleteHeader({
  athlete,
  basePath,
  counts,
  action,
}: {
  athlete: AthleteDetail;
  basePath: string;
  counts: { programs: number; teams: number; packages: number };
  action: ReactNode;
}) {
  const name = athleteName(athlete);
  return (
    <PageHeader
      title={name}
      leading={<AthleteAvatar profile={athlete} size={52} />}
      subtitle={headerSubtitle(athlete, counts)}
      backHref="/athletes"
      breadcrumbs={[{ label: "Athletes", href: "/athletes" }, { label: name }]}
      tabs={[
        { label: "Programs & teams", href: basePath },
        { label: "Details", href: `${basePath}/details` },
        { label: "Billing", href: `${basePath}/billing` },
      ]}
      tabsAction={action}
    />
  );
}

type AthleteDetailContextValue = {
  athlete: AthleteDetail;
  /** Null when the coach_athlete_account RPC failed. */
  account: AthleteAccount | null;
  links: ReturnType<typeof useAthleteLinks>;
  packagePrograms: AthletePackageProgram[];
  /** Packages the athlete has access to right now. */
  packages: AthletePackage[];
  /** `/athletes/<id>` — the Programs & teams tab; other tabs hang off it. */
  basePath: string;
  openPicker: (picker: Exclude<Picker, null>) => void;
  passwordReset: ReturnType<typeof usePasswordReset>;
  saveProfile: ReturnType<typeof useAthleteProfile>["save"];
};

const AthleteDetailContext = createContext<AthleteDetailContextValue | null>(
  null,
);

/** The athlete's optimistic state and shared actions, for the tab pages
 * rendered inside `AthleteDetailShell`. */
export function useAthleteDetailContext(): AthleteDetailContextValue {
  const value = useContext(AthleteDetailContext);
  if (!value) {
    throw new Error(
      "useAthleteDetailContext must be inside AthleteDetailShell",
    );
  }
  return value;
}

/** Header, tabs and pickers shared by every athlete tab. Rendered by the
 * `[id]` layout, so optimistic program/team edits survive switching tabs;
 * the tab pages read them through `useAthleteDetailContext`. */
export function AthleteDetailShell({
  athlete: serverAthlete,
  account,
  teams,
  packagePrograms,
  packages,
  allPrograms,
  allTeams,
  children,
  ...actions
}: AthleteDetailActions & {
  athlete: AthleteDetail;
  account: AthleteAccount | null;
  /** Teams this athlete is on, and how (by hand and/or via a package). */
  teams: AthleteTeam[];
  /** Programs from the athlete's active package purchases — read-only
   * here, since they end with the plan. */
  packagePrograms: AthletePackageProgram[];
  packages: AthletePackage[];
  allPrograms: ProgramSummary[];
  allTeams: TeamSummary[];
  children: ReactNode;
}) {
  const links = useAthleteLinks(
    serverAthlete,
    teams,
    allPrograms,
    allTeams,
    actions,
  );
  const profile = useAthleteProfile(serverAthlete, actions.updateProfileAction);
  const athlete = profile.local;
  const passwordReset = usePasswordReset(
    athlete.id,
    account,
    actions.sendPasswordResetAction,
  );
  const [picker, setPicker] = useState<Picker>(null);
  const pathname = usePathname();
  const name = athleteName(athlete);
  const basePath = `/athletes/${athlete.id}`;
  const activePackages = packages.filter((p) => p.isActive);

  const programs = mergeAthletePrograms(
    links.local.programs,
    packagePrograms,
    links.local.teams,
  );
  // A program can be listed once per source; the header counts it once.
  const programIds = new Set(programs.map((p) => p.id));

  const { programItems, teamItems } = pickerItems(
    allPrograms,
    allTeams,
    programIds,
    // Package-only teams stay pickable so a coach can keep the athlete on
    // them after their plan ends.
    new Set(links.local.teams.filter((t) => t.via.manual).map((t) => t.id)),
  );

  return (
    <AthleteDetailContext.Provider
      value={{
        athlete,
        account,
        links,
        packagePrograms,
        packages: activePackages,
        basePath,
        openPicker: setPicker,
        passwordReset,
        saveProfile: profile.save,
      }}>
      <div className="flex h-full flex-col overflow-hidden">
        <AthleteHeader
          athlete={athlete}
          basePath={basePath}
          counts={{
            programs: programIds.size,
            teams: links.local.teams.length,
            packages: activePackages.length,
          }}
          action={
            <AthleteTabAction
              tab={actionTab(pathname, basePath)}
              onPick={setPicker}
              passwordReset={passwordReset}
            />
          }
        />

        {children}

        <AthletePickers
          picker={picker}
          athleteLabel={name}
          programItems={programItems}
          teamItems={teamItems}
          links={links}
          onClose={() => setPicker(null)}
        />
      </div>
    </AthleteDetailContext.Provider>
  );
}
