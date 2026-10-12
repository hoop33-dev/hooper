import { PackageTile } from "@/src/components/billing/PackageTile";
import { AlertIcon, ClockIcon } from "@/src/components/icons";
import { Btn, BtnLink } from "@/src/components/ui/Btn";
import { Label, Money, Tag, Title } from "@/src/components/ui/primitives";
import { cn } from "@/src/lib/cn";
import { formatDate, formatMoney } from "@/src/lib/format";
import {
  isEnding,
  memberSince,
  nameList,
  statusTag,
} from "@/src/lib/purchases";
import type { MyPackagePurchase } from "@hooper/db";

const BILLING: Record<string, string> = {
  week: "Weekly",
  month: "Monthly",
  quarter: "Every 3 months",
  year: "Yearly",
};

function details(p: MyPackagePurchase): [string, string][] {
  const subscription = p.kind === "subscription";
  const periodEnd = p.current_period_end
    ? formatDate(p.current_period_end)
    : "—";
  const first: [string, string] = !subscription
    ? p.access_until
      ? ["Access until", formatDate(p.access_until)]
      : ["Paid", p.paid_at ? formatDate(p.paid_at) : "—"]
    : isEnding(p)
      ? ["Access until", periodEnd]
      : ["Next charge", periodEnd];
  const rows: [string, string][] = [
    first,
    [
      "Billing",
      subscription
        ? (BILLING[p.billing_interval ?? "month"] ?? "Recurring")
        : "One-off payment",
    ],
  ];
  if (p.coach_names.length > 0) {
    rows.push([
      p.coach_names.length > 1 ? "Coaches" : "Coach",
      nameList(p.coach_names),
    ]);
  }
  rows.push(["Member since", memberSince(p)]);
  return rows;
}

type Actions = {
  canStop: boolean;
  canKeep: boolean;
  keeping: boolean;
  onStop: () => void;
  onKeep: () => void;
};

/** Design `MembershipCard`, "columns" variant: header, a row of detail
 * columns, an attention band when it's failed or cancelled, then actions. */
export function MembershipCard({
  purchase: p,
  ...actions
}: Actions & { purchase: MyPackagePurchase }) {
  return (
    <div
      className={cn(
        "bg-bp-card rounded-xl border",
        p.status === "past_due" ? "border-danger/30" : "border-bp-border",
      )}>
      <CardHeader purchase={p} />
      <DetailColumns rows={details(p)} />
      <AttentionBand purchase={p} />
      <ActionRow programs={p.program_names} {...actions} />
    </div>
  );
}

function CardHeader({ purchase: p }: { purchase: MyPackagePurchase }) {
  const status = statusTag(p);
  const programs = p.program_names.length;
  return (
    <div className="flex items-center gap-3.5 p-4 md:px-[22px] md:py-[18px]">
      <PackageTile name={p.package_name} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Title className="text-[18px]">{p.package_name}</Title>
          {status && <Tag tone={status.tone}>{status.label}</Tag>}
        </div>
        <div className="text-bp-text2 mt-[3px] text-[12.5px]">
          {programs > 0
            ? `${programs} program${programs === 1 ? "" : "s"}`
            : "Package"}
          {p.coach_names[0] && ` from ${p.coach_names[0]}`}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <Money className="text-bp-text1 text-[19px] md:text-[22px]">
          {formatMoney(p.amount_cents)}
        </Money>
        <div className="text-bp-text3 text-[11px]">
          {p.kind === "subscription"
            ? `/ ${p.billing_interval ?? "month"}`
            : "one-off"}
        </div>
      </div>
    </div>
  );
}

function DetailColumns({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="border-bp-border mx-4 grid grid-cols-2 gap-y-3 border-t pt-3.5 pb-4 md:mx-[22px] md:flex">
      {rows.map(([label, value], i) => (
        <div
          key={label}
          // Dividers between columns: every other one in the 2-up mobile
          // grid, all but the first on the desktop row.
          className={cn(
            "border-bp-border min-w-0 md:flex-1",
            i % 2 === 1 && "border-l pl-4",
            i > 0 && "md:ml-4 md:border-l md:pl-4",
          )}>
          <dt>
            <Label className="mb-1">{label}</Label>
          </dt>
          <dd className="text-bp-text1 text-[13px] leading-[1.4] font-semibold">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function AttentionBand({ purchase: p }: { purchase: MyPackagePurchase }) {
  if (p.status === "past_due") {
    return (
      <div className="border-bp-border bg-danger/10 text-danger flex items-center gap-2.5 border-t px-4 py-[11px] md:px-[22px]">
        <AlertIcon size={15} className="shrink-0" />
        <span className="min-w-0 flex-1 text-[12.5px] font-semibold">
          The last charge failed. Update your card and Stripe will retry
        </span>
        <BtnLink href="/account" variant="primary" size="sm">
          Update card
        </BtnLink>
      </div>
    );
  }
  if (!isEnding(p)) return null;
  const until = p.current_period_end ? formatDate(p.current_period_end) : "";
  return (
    <div className="border-bp-border bg-bp-bg text-bp-text2 flex items-center gap-2.5 border-t px-4 py-[11px] md:px-[22px]">
      <ClockIcon size={15} className="text-bp-text3 shrink-0" />
      <span className="min-w-0 flex-1 text-[12.5px] font-semibold">
        Cancelled — access until {until}, no more charges
      </span>
    </div>
  );
}

function ActionRow({
  programs,
  canStop,
  canKeep,
  keeping,
  onStop,
  onKeep,
}: Actions & { programs: string[] }) {
  if (!canStop && !canKeep && programs.length === 0) return null;
  return (
    <div className="border-bp-border flex flex-wrap items-center gap-2 border-t px-4 py-[11px] md:px-[22px]">
      {canKeep && (
        <Btn variant="ghost" size="sm" loading={keeping} onClick={onKeep}>
          Keep membership
        </Btn>
      )}
      {canStop && (
        <Btn variant="quietDanger" size="sm" onClick={onStop}>
          Stop membership
        </Btn>
      )}
      {programs.length > 0 && (
        <span className="text-bp-text3 ml-auto hidden text-xs md:inline">
          Includes {programs.join(", ")}
        </span>
      )}
    </div>
  );
}
