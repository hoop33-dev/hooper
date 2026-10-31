"use client";

import {
  mergeAthletePrograms,
  type AthleteProgramEntry,
} from "@/src/lib/athletePrograms";
import { formatShortDate, plural } from "@/src/lib/format";
import { money } from "@/src/lib/packages";
import type { AthletePackage } from "@/src/services/athlete.service";
import type { AthleteTeam, ProgramProgressStats } from "@hooper/db";
import { AppLink } from "@hooper/shared/next";
import { MembershipTrail, PackageBadge } from "../packages/ViaPackage";
import {
  DetailError,
  DetailListCard,
  DetailRow,
  RemoveButton,
} from "../ui/DetailListCard";
import { ChevronRightIcon, PackageIcon, UsersIcon } from "../ui/icons";
import { LetterTile } from "../ui/LetterTile";
import { PortalBadge } from "../ui/PortalBadge";
import { TeamTile } from "./AthleteAvatar";
import { useAthleteDetailContext } from "./AthleteDetailShell";

function TeamBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-[rgba(0,71,186,0.09)] px-[7px] py-px text-[10px] font-bold tracking-[0.06em] text-[#0047BA] uppercase">
      <UsersIcon size={10} />
      <span className="truncate">{name}</span>
    </span>
  );
}

export function PackageTile({ size = 34 }: { size?: number }) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-lg bg-[rgba(0,71,186,0.09)] text-[#0047BA]"
      style={{ width: size, height: size }}>
      <PackageIcon size={Math.round(size * 0.46)} />
    </div>
  );
}

/** "Active" / "Past due" / "Cancelling" for a membership, "Paid" for a
 * one-off. */
export function PackageStatusBadge({
  status,
  recurring,
  cancelAtPeriodEnd,
}: {
  status: AthletePackage["status"];
  recurring: boolean;
  cancelAtPeriodEnd: boolean;
}) {
  if (status === "past_due")
    return <PortalBadge variant="red">Past due</PortalBadge>;
  if (status === "canceled" || status === "expired") {
    return (
      <PortalBadge>
        {status === "canceled" ? "Cancelled" : "Expired"}
      </PortalBadge>
    );
  }
  if (!recurring) return <PortalBadge>Paid</PortalBadge>;
  if (cancelAtPeriodEnd)
    return <PortalBadge variant="orange">Cancelling</PortalBadge>;
  return <PortalBadge variant="green">Active</PortalBadge>;
}

function packageSub(p: AthletePackage): string {
  if (p.billing_type === "recurring") {
    const price = `${money(p.price_cents)}/${p.billing_interval}`;
    if (!p.currentPeriodEnd) return price;
    const end = formatShortDate(p.currentPeriodEnd);
    return p.cancelAtPeriodEnd
      ? `${price}, ends ${end}`
      : `${price}, renews ${end}`;
  }
  return `${money(p.price_cents)} one-off, ${
    p.accessUntil
      ? `access until ${formatShortDate(p.accessUntil)}`
      : "unlimited access"
  }`;
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
      href={`/programs/${entry.id}`}
      lead={<LetterTile name={entry.name} />}
      title={entry.name}
      sub={
        <>
          <span className="flex-shrink-0">{progressLabel(stats)}</span>
          {entry.via.kind === "package" && (
            <PackageBadge packages={[entry.via.package]} />
          )}
          {entry.via.kind === "team" && <TeamBadge name={entry.via.team} />}
        </>
      }
      trail={
        entry.via.kind === "direct" ? (
          <RemoveButton label={entry.name} onClick={onRemove} />
        ) : (
          <span className="text-portal-text3 text-[11px] whitespace-nowrap">
            {entry.via.kind === "package" ? "Via package" : "Via team"}
          </span>
        )
      }
    />
  );
}

function AthleteTeamsCard({
  teams,
  onAdd,
  onRemove,
}: {
  teams: AthleteTeam[];
  onAdd: () => void;
  onRemove: (teamId: string) => void;
}) {
  return (
    <DetailListCard
      title="Teams"
      count={teams.length}
      onAdd={onAdd}
      emptyLabel="Not on any teams."
      emptyCta="Add to team">
      {teams.map((t) => (
        <DetailRow
          key={t.id}
          href={`/teams/${t.id}`}
          lead={<TeamTile team={t} size={34} />}
          title={t.name}
          sub={
            <>
              <span className="flex-shrink-0">
                {plural(t.memberCount, "athlete")}
              </span>
              <PackageBadge packages={t.via.packages} />
            </>
          }
          trail={
            <MembershipTrail
              via={t.via}
              label={t.name}
              onRemove={() => onRemove(t.id)}
            />
          }
        />
      ))}
    </DetailListCard>
  );
}

function AthletePackagesCard({
  packages,
  billingHref,
}: {
  packages: AthletePackage[];
  billingHref: string;
}) {
  return (
    <div className="border-portal-border bg-portal-card overflow-hidden rounded-xl border">
      <div className="border-portal-border flex items-center justify-between border-b px-5 py-3.5">
        <h2 className="text-portal-text1 text-sm font-bold">
          Packages ({packages.length})
        </h2>
        <AppLink
          href={billingHref}
          className="text-portal-orange flex items-center gap-1 text-[13px] font-semibold">
          Billing <ChevronRightIcon size={12} />
        </AppLink>
      </div>
      {packages.length === 0 ? (
        <p className="text-portal-text3 p-7 text-center text-[13px]">
          No active packages.
        </p>
      ) : (
        packages.map((p) => (
          <DetailRow
            key={p.purchaseId}
            href={`/packages/${p.slug}`}
            lead={<PackageTile />}
            title={p.name}
            sub={packageSub(p)}
            trail={
              <PackageStatusBadge
                status={p.status}
                recurring={p.billing_type === "recurring"}
                cancelAtPeriodEnd={p.cancelAtPeriodEnd}
              />
            }
          />
        ))
      )}
    </div>
  );
}

/** The Programs & teams tab: packages and teams on the left, every program
 * the athlete sees (and how) on the right. */
export function AthleteTrainingTab({
  programStats,
}: {
  /** Per-program progress keyed by program id — see
   * `getAthleteProgramProgress`. */
  programStats: Record<string, ProgramProgressStats>;
}) {
  const { links, packagePrograms, packages, basePath, openPicker } =
    useAthleteDetailContext();
  const programs = mergeAthletePrograms(
    links.local.programs,
    packagePrograms,
    links.local.teams,
  );

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-7">
      <DetailError error={links.error} />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <div className="flex flex-col gap-5">
          <AthletePackagesCard
            packages={packages}
            billingHref={`${basePath}/billing`}
          />
          <AthleteTeamsCard
            teams={links.local.teams}
            onAdd={() => openPicker("team")}
            onRemove={links.removeTeam}
          />
        </div>

        <DetailListCard
          title="Programs"
          count={programs.length}
          onAdd={() => openPicker("program")}
          addLabel="Assign"
          emptyLabel="No programs assigned."
          emptyCta="Assign program">
          {programs.map((entry) => (
            <ProgramRow
              key={entry.key}
              entry={entry}
              stats={programStats[entry.id]}
              onRemove={() => links.unassignProgram(entry.id)}
            />
          ))}
        </DetailListCard>
      </div>
    </div>
  );
}
