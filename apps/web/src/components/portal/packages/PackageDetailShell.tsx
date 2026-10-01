"use client";

import { formatProgramSub, formatShortDate, plural } from "@/src/lib/format";
import {
  formatPackagePrice,
  pickPricing,
  type PackagePricing,
} from "@/src/lib/packages";
import type {
  PackageCoachRef,
  PackageDetail,
  PackageProgramRef,
  PackageRow,
  ProgramSummary,
} from "@hooper/db";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DetailError,
  DetailListCard,
  DetailRow,
  RemoveButton,
} from "../ui/DetailListCard";
import { LetterTile } from "../ui/LetterTile";
import { PageHeader } from "../ui/PageHeader";
import { PortalButton } from "../ui/PortalButton";
import {
  SearchPickerModal,
  type SearchPickerItem,
} from "../ui/SearchPickerModal";
import { useOptimisticDetail } from "../ui/useOptimisticDetail";
import { CoachAvatar, coachName } from "./PackageAtoms";
import {
  ActiveBuyersCard,
  PackageLinkCard,
  PricingCard,
} from "./PackageDetailCards";
import { PackageEditDrawer } from "./PackageEditDrawer";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };
type Modal = "program" | "coach" | "edit" | null;

type PackageDetailActions = {
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
};

function usePackageDetail(
  pkg: PackageDetail,
  allPrograms: ProgramSummary[],
  allCoaches: PackageCoachRef[],
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
    remove: async (): Promise<ActionResult> => {
      const result = await actions.deleteAction(id);
      if (result.ok) router.push("/packages");
      return result;
    },
  };
}

type PackageDetailState = ReturnType<typeof usePackageDetail>;

function coachSub(coach: PackageCoachRef): string | undefined {
  return coach.username ? `@${coach.username}` : undefined;
}

function PackageDetailBody({
  state,
  onOpen,
}: {
  state: PackageDetailState;
  onOpen: (modal: Modal) => void;
}) {
  const { local } = state;
  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-7">
      <DetailError error={state.error} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
        <PackageLinkCard slug={local.slug} />
        <ActiveBuyersCard />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <PricingCard pricing={pickPricing(local)} onSave={state.savePricing} />
        <DetailListCard
          title="Programs"
          count={local.programs.length}
          onAdd={() => onOpen("program")}
          emptyLabel="No programs in this package."
          emptyCta="Add program">
          {local.programs.map((p) => (
            <DetailRow
              key={p.id}
              lead={<LetterTile name={p.name} />}
              title={p.name}
              sub={formatProgramSub(p)}
              trail={
                <RemoveButton
                  label={p.name}
                  onClick={() => state.removeProgram(p.id)}
                />
              }
            />
          ))}
        </DetailListCard>
        <DetailListCard
          title="Coaches"
          count={local.coaches.length}
          onAdd={() => onOpen("coach")}
          emptyLabel="No coaches on this package."
          emptyCta="Add coach">
          {local.coaches.map((c) => (
            <DetailRow
              key={c.id}
              lead={<CoachAvatar coach={c} size={34} />}
              title={coachName(c)}
              sub={coachSub(c)}
              trail={
                <RemoveButton
                  label={coachName(c)}
                  onClick={() => state.removeCoach(c.id)}
                />
              }
            />
          ))}
        </DetailListCard>
      </div>
    </div>
  );
}

function PackagePickers({
  modal,
  state,
  programItems,
  coachItems,
  onClose,
}: {
  modal: Modal;
  state: PackageDetailState;
  programItems: SearchPickerItem[];
  coachItems: SearchPickerItem[];
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

export function PackageDetailShell({
  pkg,
  allPrograms,
  allCoaches,
  ...actions
}: PackageDetailActions & {
  pkg: PackageDetail;
  allPrograms: ProgramSummary[];
  allCoaches: PackageCoachRef[];
}) {
  const state = usePackageDetail(pkg, allPrograms, allCoaches, actions);
  const { local } = state;
  const [modal, setModal] = useState<Modal>(null);
  const summary = `${formatPackagePrice(local)} with ${plural(local.programs.length, "program")} and ${plural(
    local.coaches.length,
    "coach",
    "coaches",
  )}. Created ${formatShortDate(local.created_at)}`;

  const attachedProgramIds = new Set(local.programs.map((p) => p.id));
  const attachedCoachIds = new Set(local.coaches.map((c) => c.id));
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

  return (
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
      />

      <PackageDetailBody state={state} onOpen={setModal} />

      <PackagePickers
        modal={modal}
        state={state}
        programItems={programItems}
        coachItems={coachItems}
        onClose={() => setModal(null)}
      />
    </div>
  );
}
