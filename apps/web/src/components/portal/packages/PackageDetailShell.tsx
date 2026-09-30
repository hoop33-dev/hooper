"use client";

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
import { useEffect, useState } from "react";
import { formatSessionsPerWeek } from "../programs/ProgramsTable";
import { PageHeader } from "../ui/PageHeader";
import { PortalButton } from "../ui/PortalButton";
import {
  AddPackageItemModal,
  type PackagePickItem,
} from "./AddPackageItemModal";
import { CoachAvatar, coachName } from "./PackageAtoms";
import {
  ActiveBuyersCard,
  PackageLinkCard,
  PackageListCard,
  PricingCard,
} from "./PackageDetailCards";
import { PackageEditDrawer } from "./PackageEditDrawer";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };
type Modal = "program" | "coach" | "edit" | null;

function ProgramTile({ name }: { name: string }) {
  return (
    <div className="bg-portal-orange-soft text-portal-orange flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-extrabold">
      {name.trim().charAt(0).toUpperCase() || "P"}
    </div>
  );
}

function programSub(program: {
  weeks: number;
  sessionsPerWeek: ProgramSummary["sessionsPerWeek"];
}): string {
  return `${program.weeks} wk · ${formatSessionsPerWeek(program.sessionsPerWeek)}`;
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

function formatCreated(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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

/** Local mirror of the package with optimistic edits. Each edit applies
 * straight away, runs its action, and rolls back + surfaces the error if it
 * fails; a refresh follows either way so the server's copy wins (a refresh's
 * new props replace the local copy wholesale, same as useOptimisticList). */
function usePackageDetail(
  pkg: PackageDetail,
  allPrograms: ProgramSummary[],
  allCoaches: PackageCoachRef[],
  actions: PackageDetailActions,
) {
  const router = useRouter();
  const [local, setLocal] = useState(pkg);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setLocal(pkg), [pkg]);

  async function mutate(
    patch: (prev: PackageDetail) => PackageDetail,
    action: () => Promise<ActionResult<unknown>>,
  ): Promise<ActionResult> {
    const rollback = local;
    setLocal(patch);
    setError(null);
    const result = await action();
    if (!result.ok) {
      setLocal(rollback);
      setError(result.error ?? "Something went wrong.");
    }
    router.refresh();
    return { ok: result.ok, error: result.error };
  }

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
    addProgram: (programId: string) => {
      const program = allPrograms.find((p) => p.id === programId);
      if (!program) return;
      const ref: PackageProgramRef = {
        id: program.id,
        name: program.name,
        weeks: program.weeks,
        sessionsPerWeek: program.sessionsPerWeek,
      };
      void mutate(
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
    addCoach: (profileId: string) => {
      const coach = allCoaches.find((c) => c.id === profileId);
      if (!coach) return;
      void mutate(
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

function programItemsFor(programs: ProgramSummary[]): PackagePickItem[] {
  return programs.map((p) => ({
    id: p.id,
    title: p.name,
    sub: programSub(p),
    lead: <ProgramTile name={p.name} />,
  }));
}

function coachItemsFor(
  coaches: PackageCoachRef[],
  size: number,
): PackagePickItem[] {
  return coaches.map((c) => ({
    id: c.id,
    title: coachName(c),
    sub: c.username ? `@${c.username}` : undefined,
    lead: <CoachAvatar coach={c} size={size} />,
  }));
}

function PackageDetailBody({
  state,
  canAddProgram,
  canAddCoach,
  onOpen,
}: {
  state: PackageDetailState;
  canAddProgram: boolean;
  canAddCoach: boolean;
  onOpen: (modal: Modal) => void;
}) {
  const { local } = state;
  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-7">
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">
          {state.error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
        <PackageLinkCard slug={local.slug} />
        <ActiveBuyersCard />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <PricingCard pricing={pickPricing(local)} onSave={state.savePricing} />
        <PackageListCard
          title="Programs"
          items={local.programs.map((p) => ({
            id: p.id,
            title: p.name,
            sub: programSub(p),
            lead: <ProgramTile name={p.name} />,
          }))}
          emptyLabel="No programs in this package."
          addLabel="Add program"
          canAdd={canAddProgram}
          onAdd={() => onOpen("program")}
          onRemove={state.removeProgram}
        />
        <PackageListCard
          title="Coaches"
          items={coachItemsFor(local.coaches, 34)}
          emptyLabel="No coaches on this package."
          addLabel="Add coach"
          canAdd={canAddCoach}
          onAdd={() => onOpen("coach")}
          onRemove={state.removeCoach}
        />
      </div>
    </div>
  );
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
  const close = () => setModal(null);
  const summary = `${formatPackagePrice(local)} with ${plural(local.programs.length, "program", "programs")} and ${plural(
    local.coaches.length,
    "coach",
    "coaches",
  )}. Created ${formatCreated(local.created_at)}`;

  const attachedProgramIds = new Set(local.programs.map((p) => p.id));
  const attachedCoachIds = new Set(local.coaches.map((c) => c.id));
  const programItems = programItemsFor(
    allPrograms.filter((p) => !attachedProgramIds.has(p.id)),
  );
  const coachItems = coachItemsFor(
    allCoaches.filter((c) => !attachedCoachIds.has(c.id)),
    36,
  );

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

      <PackageDetailBody
        state={state}
        canAddProgram={programItems.length > 0}
        canAddCoach={coachItems.length > 0}
        onOpen={setModal}
      />

      {modal === "program" && (
        <AddPackageItemModal
          title="Add program"
          packageName={local.name}
          items={programItems}
          emptyLabel="All programs are already in this package."
          searchPlaceholder="Search programs…"
          onPick={state.addProgram}
          onClose={close}
        />
      )}
      {modal === "coach" && (
        <AddPackageItemModal
          title="Add coach"
          packageName={local.name}
          items={coachItems}
          emptyLabel="All coaches are already on this package."
          searchPlaceholder="Search coaches…"
          onPick={state.addCoach}
          onClose={close}
        />
      )}
      {modal === "edit" && (
        <PackageEditDrawer
          name={local.name}
          slug={local.slug}
          onSave={state.rename}
          onDelete={state.remove}
          onClose={close}
        />
      )}
    </div>
  );
}
