import type { TeamMembershipVia } from "@hooper/db";
import { RemoveButton } from "../ui/DetailListCard";
import { PackageIcon } from "../ui/icons";

/** Sub-line tag for team membership that comes from a package purchase —
 * matches the athlete page's team badge. */
export function PackageBadge({
  packages,
}: {
  packages: TeamMembershipVia["packages"];
}) {
  if (packages.length === 0) return null;
  const label =
    packages.length === 1 ? packages[0].name : `${packages.length} packages`;
  return (
    <span
      title={packages.map((p) => p.name).join(", ")}
      className="bg-portal-orange-soft text-portal-orange inline-flex min-w-0 items-center gap-1 rounded-full px-[7px] py-px text-[10px] font-bold tracking-[0.06em] uppercase">
      <PackageIcon size={10} />
      <span className="truncate">{label}</span>
    </span>
  );
}

/** Row trail for a team membership: a remove button for the manual part, or
 * "Via package" when a purchase is the only reason they're on the team (it
 * ends with their plan, so there's nothing for the coach to remove). */
export function MembershipTrail({
  via,
  label,
  onRemove,
}: {
  via: TeamMembershipVia;
  label: string;
  onRemove: () => void;
}) {
  if (via.manual) return <RemoveButton label={label} onClick={onRemove} />;
  return (
    <span className="text-portal-text3 text-[11px] whitespace-nowrap">
      Via package
    </span>
  );
}

/** Optimistic removal of a membership's manual part: drops the row unless a
 * package still keeps them on the team. */
export function withoutManual<T extends { via: TeamMembershipVia }>(
  rows: T[],
  match: (row: T) => boolean,
): T[] {
  return rows.flatMap((row) => {
    if (!match(row)) return [row];
    if (row.via.packages.length === 0) return [];
    return [{ ...row, via: { ...row.via, manual: false } }];
  });
}
