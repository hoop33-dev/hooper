"use client";

import { formatProgramSub, formatShortDate, plural } from "@/src/lib/format";
import { formatPackagePrice, type PackagePricing } from "@/src/lib/packages";
import type {
  PackageCoachRef,
  PackageDetail,
  PackageProgramRef,
  PackageRow,
  PackageTeamRef,
  ProgramSummary,
  TeamSummary,
} from "@hooper/db";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useState, type ReactNode } from "react";
import { TeamTile } from "../athletes/AthleteAvatar";
import { LetterTile } from "../ui/LetterTile";
import { SearchInput } from "../ui/ListToolbar";
import { PageHeader } from "../ui/PageHeader";
import { PortalButton } from "../ui/PortalButton";
import {
  SearchPickerModal,
  type SearchPickerItem,
} from "../ui/SearchPickerModal";
import { useOptimisticDetail } from "../ui/useOptimisticDetail";
import { CoachAvatar, coachName } from "./PackageAtoms";
import { PackageEditDrawer } from "./PackageEditDrawer";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };
type Modal = "program" | "coach" | "team" | "edit" | null;

export type PackageDetailActions = {
  updateAction: (
    id: string,
    data: Partial<PackagePricing> & { name?: string },
  ) => Promise<ActionResult<PackageRow>>;
  deleteAction: (id: string) => Promise<ActionResult>;
  addProgramAction: (
    packageId: string,
    programId: string,
  ) => Promise<ActionResult>;
  removeProgramAction: (
    packageId: string,
    programId: string,
  ) => Promise<ActionResult>;
  addCoachAction: (
    packageId: string,
    profileId: string,
  ) => Promise<ActionResult>;
  removeCoachAction: (
    packageId: string,
    profileId: string,
  ) => Promise<ActionResult>;
  addTeamAction: (packageId: string, teamId: string) => Promise<ActionResult>;
  removeTeamAction: (
    packageId: string,
    teamId: string,
  ) => Promise<ActionResult>;
};

function usePackageDetail(
  pkg: PackageDetail,
  allPrograms: ProgramSummary[],
  allCoaches: PackageCoachRef[],
  allTeams: TeamSummary[],
  actions: PackageDetailActions,
) {
  const router = useRouter();
  const { local, error, mutate } = useOptimisticDetail(pkg);
  const id = local.id;
  return {
    local,
    error,
    rename: (name: string) =>
      mutate(
        (prev) => ({ ...prev, name }),
        () => actions.updateAction(id, { name }),
      ),
    savePricing: (pricing: PackagePricing) =>
      mutate(
        (prev) => ({ ...prev, ...pricing }),
        () => actions.updateAction(id, pricing),
      ),
    addProgram: async (programId: string): Promise<ActionResult> => {
      const program = allPrograms.find((p) => p.id === programId);
      if (!program) return { ok: false, error: "Program not found." };
      const ref: PackageProgramRef = {
        id: program.id,
        name: program.name,
        weeks: program.weeks,
        sessionsPerWeek: program.sessionsPerWeek,
      };
      return mutate(
        (prev) => ({ ...prev, programs: [...prev.programs, ref] }),
        () => actions.addProgramAction(id, programId),
      );
    },
    removeProgram: (programId: string) =>
      void mutate(
        (prev) => ({
          ...prev,
          programs: prev.programs.filter((p) => p.id !== programId),
        }),
        () => actions.removeProgramAction(id, programId),
      ),
    addCoach: async (profileId: string): Promise<ActionResult> => {
      const coach = allCoaches.find((c) => c.id === profileId);
      if (!coach) return { ok: false, error: "Coach not found." };
      return mutate(
        (prev) => ({ ...prev, coaches: [...prev.coaches, coach] }),
        () => actions.addCoachAction(id, profileId),
      );
    },
    removeCoach: (profileId: string) =>
      void mutate(
        (prev) => ({
          ...prev,
          coaches: prev.coaches.filter((c) => c.id !== profileId),
        }),
        () => actions.removeCoachAction(id, profileId),
      ),
    addTeam: async (teamId: string): Promise<ActionResult> => {
      const team = allTeams.find((t) => t.id === teamId);
      if (!team) return { ok: false, error: "Team not found." };
      const ref: PackageTeamRef = {
        id: team.id,
        name: team.name,
        avatar_url: team.avatar_url,
      };
      return mutate(
        (prev) => ({ ...prev, teams: [...prev.teams, ref] }),
        () => actions.addTeamAction(id, teamId),
      );
    },
    removeTeam: (teamId: string) =>
      void mutate(
        (prev) => ({
          ...prev,
          teams: prev.teams.filter((t) => t.id !== teamId),
        }),
        () => actions.removeTeamAction(id, teamId),
      ),
    remove: async (): Promise<ActionResult> => {
      const result = await actions.deleteAction(id);
      if (result.ok) router.push("/packages");
      return result;
    },
  };
}

type PackageDetailState = ReturnType<typeof usePackageDetail>;

export function coachSub(coach: PackageCoachRef): string | undefined {
  return coach.username ? `@${coach.username}` : undefined;
}

function PackagePickers({
  modal,
  state,
  programItems,
  coachItems,
  teamItems,
  onClose,
}: {
  modal: Modal;
  state: PackageDetailState;
  programItems: SearchPickerItem[];
  coachItems: SearchPickerItem[];
  teamItems: SearchPickerItem[];
  onClose: () => void;
}) {
  const { local } = state;
  if (modal === "program") {
    return (
      <SearchPickerModal
        title="Add program"
        subtitle={local.name}
        placeholder="Search programs…"
        items={programItems}
        emptyLabel="All programs are already in this package."
        onAdd={state.addProgram}
        onClose={onClose}
      />
    );
  }
  if (modal === "coach") {
    return (
      <SearchPickerModal
        title="Add coach"
        subtitle={local.name}
        placeholder="Search coaches…"
        items={coachItems}
        emptyLabel="All coaches are already on this package."
        onAdd={state.addCoach}
        onClose={onClose}
      />
    );
  }
  if (modal === "team") {
    return (
      <SearchPickerModal
        title="Add team"
        subtitle={local.name}
        placeholder="Search teams…"
        items={teamItems}
        emptyLabel="All teams are already in this package."
        onAdd={state.addTeam}
        onClose={onClose}
      />
    );
  }
  if (modal === "edit") {
    return (
      <PackageEditDrawer
        name={local.name}
        slug={local.slug}
        onSave={state.rename}
        onDelete={state.remove}
        onClose={onClose}
      />
    );
  }
  return null;
}

/** Picker candidates: everything not already attached to the package. */
function pickerItems(
  local: PackageDetail,
  allPrograms: ProgramSummary[],
  allCoaches: PackageCoachRef[],
  allTeams: TeamSummary[],
) {
  const attachedProgramIds = new Set(local.programs.map((p) => p.id));
  const attachedCoachIds = new Set(local.coaches.map((c) => c.id));
  const attachedTeamIds = new Set(local.teams.map((t) => t.id));
  const programItems: SearchPickerItem[] = allPrograms
    .filter((p) => !attachedProgramIds.has(p.id))
    .map((p) => ({
      id: p.id,
      title: p.name,
      sub: formatProgramSub(p),
      lead: <LetterTile name={p.name} />,
    }));
  const coachItems: SearchPickerItem[] = allCoaches
    .filter((c) => !attachedCoachIds.has(c.id))
    .map((c) => ({
      id: c.id,
      title: coachName(c),
      sub: coachSub(c),
      search: c.username ?? undefined,
      lead: <CoachAvatar coach={c} size={36} />,
    }));
  const teamItems: SearchPickerItem[] = allTeams
    .filter((t) => !attachedTeamIds.has(t.id))
    .map((t) => ({
      id: t.id,
      title: t.name,
      sub: `${plural(t.memberCount, "athlete")} · ${plural(t.programs.length, "program")}`,
      lead: <TeamTile team={t} />,
    }));
  return { programItems, coachItems, teamItems };
}

/** Buyer numbers for the header tab and the Overview card. */
export type PackageBuyerCounts = {
  /** Distinct athletes with access right now. */
  active: number;
  /** Every purchase, ended ones included — the Buyers tab's row count. */
  total: number;
};

type PackageDetailContextValue = {
  state: PackageDetailState;
  buyers: PackageBuyerCounts;
  /** Team id → member count, for the Teams card. */
  memberCounts: Map<string, number>;
  /** `/packages/<slug>` — the Overview tab; other tabs hang off it. */
  basePath: string;
  /** The Buyers tab's search, whose input sits on the header's tab row. */
  buyerSearch: string;
  openModal: (modal: Exclude<Modal, null>) => void;
};

const PackageDetailContext = createContext<PackageDetailContextValue | null>(
  null,
);

/** The package's optimistic state and modal launcher, for the tab pages
 * rendered inside `PackageDetailShell`. */
export function usePackageDetailContext(): PackageDetailContextValue {
  const value = useContext(PackageDetailContext);
  if (!value) {
    throw new Error(
      "usePackageDetailContext must be inside PackageDetailShell",
    );
  }
  return value;
}

/** Header, tabs and pickers shared by every package tab. Rendered by the
 * `[slug]` layout, so its optimistic state survives switching tabs; the tab
 * pages read it through `usePackageDetailContext`. */
export function PackageDetailShell({
  pkg,
  allPrograms,
  allCoaches,
  allTeams,
  buyers,
  children,
  ...actions
}: PackageDetailActions & {
  pkg: PackageDetail;
  allPrograms: ProgramSummary[];
  allCoaches: PackageCoachRef[];
  allTeams: TeamSummary[];
  buyers: PackageBuyerCounts;
  children: ReactNode;
}) {
  const state = usePackageDetail(
    pkg,
    allPrograms,
    allCoaches,
    allTeams,
    actions,
  );
  const { local } = state;
  const [modal, setModal] = useState<Modal>(null);
  const [buyerSearch, setBuyerSearch] = useState("");
  const pathname = usePathname();
  const summary = `${formatPackagePrice(local)} with ${plural(local.programs.length, "program")} and ${plural(
    local.coaches.length,
    "coach",
    "coaches",
  )}. Created ${formatShortDate(local.created_at)}`;
  const basePath = `/packages/${local.slug}`;
  const buyersPath = `${basePath}/buyers`;

  const { programItems, coachItems, teamItems } = pickerItems(
    local,
    allPrograms,
    allCoaches,
    allTeams,
  );
  const memberCounts = new Map(allTeams.map((t) => [t.id, t.memberCount]));

  return (
    <PackageDetailContext.Provider
      value={{
        state,
        buyers,
        memberCounts,
        basePath,
        buyerSearch,
        openModal: setModal,
      }}>
      <div className="flex h-full flex-col overflow-hidden">
        <PageHeader
          title={local.name}
          subtitle={summary}
          backHref="/packages"
          breadcrumbs={[
            { label: "Packages", href: "/packages" },
            { label: local.name },
          ]}
          action={
            <PortalButton variant="secondary" onClick={() => setModal("edit")}>
              Edit package
            </PortalButton>
          }
          tabs={[
            { label: "Overview", href: basePath },
            { label: "Contents", href: `${basePath}/contents` },
            {
              label: "Buyers",
              href: buyersPath,
              count: buyers.total,
            },
          ]}
          tabsAction={
            pathname === buyersPath && (
              <SearchInput
                value={buyerSearch}
                onChange={setBuyerSearch}
                placeholder="Search buyers…"
              />
            )
          }
        />

        {children}

        <PackagePickers
          modal={modal}
          state={state}
          programItems={programItems}
          coachItems={coachItems}
          teamItems={teamItems}
          onClose={() => setModal(null)}
        />
      </div>
    </PackageDetailContext.Provider>
  );
}
