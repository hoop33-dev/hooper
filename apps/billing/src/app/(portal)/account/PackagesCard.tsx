import { CalendarIcon } from "@/src/components/icons";
import { Card, Label, Tag, type TagTone } from "@/src/components/ui/primitives";
import { formatDate, formatMoney } from "@/src/lib/format";
import type { MyPackagePurchase, PackagePurchaseStatus } from "@hooper/db";

const STATUS: Record<PackagePurchaseStatus, { label: string; tone: TagTone }> =
  {
    active: { label: "Active", tone: "green" },
    past_due: { label: "Payment failed", tone: "danger" },
    incomplete: { label: "Unpaid", tone: "amber" },
    canceled: { label: "Cancelled", tone: "neutral" },
    expired: { label: "Ended", tone: "neutral" },
  };

/** "Renews 12 Oct 2026" / "Access until …" / "Ongoing access". */
export function accessLine(p: MyPackagePurchase): string {
  if (p.status === "canceled") {
    return p.current_period_end
      ? `Ended ${formatDate(p.current_period_end)}`
      : "Cancelled";
  }
  if (p.kind === "subscription") {
    return p.current_period_end
      ? `Renews ${formatDate(p.current_period_end)}`
      : "Monthly";
  }
  if (!p.access_until) return "Ongoing access";
  const ended = new Date(p.access_until) < new Date();
  return `${ended ? "Ended" : "Access until"} ${formatDate(p.access_until)}`;
}

function isExpired(p: MyPackagePurchase) {
  return (
    p.kind === "one_time" &&
    !!p.access_until &&
    new Date(p.access_until) < new Date()
  );
}

export function PackagesCard({
  purchases,
  error,
}: {
  purchases: MyPackagePurchase[];
  error: string | null;
}) {
  // Abandoned checkouts aren't purchases from the user's point of view.
  const shown = purchases.filter(
    (p) => p.status !== "incomplete" && p.status !== "expired",
  );

  return (
    <Card>
      <Label className="mb-1.5">Your packages</Label>
      {error && <div className="text-danger py-3 text-[13px]">{error}</div>}
      {!error && shown.length === 0 && (
        <div className="text-bp-text2 py-3 text-[13.5px]">
          No packages yet. Your coach will send you a link to buy one.
        </div>
      )}
      <ul>
        {shown.map((p, i) => {
          const status = isExpired(p) ? STATUS.expired : STATUS[p.status];
          return (
            <li
              key={p.id}
              className={`flex items-center gap-3 py-3 ${i < shown.length - 1 ? "border-bp-border border-b" : ""}`}>
              <div className="bg-orange/10 text-orange flex size-9 shrink-0 items-center justify-center rounded-[9px]">
                <CalendarIcon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-bp-text1 truncate text-sm font-bold">
                  {p.package_name}
                </div>
                <div className="text-bp-text2 mt-0.5 text-[12.5px]">
                  {formatMoney(p.amount_cents)} · {accessLine(p)}
                </div>
              </div>
              <Tag tone={status.tone}>{status.label}</Tag>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
