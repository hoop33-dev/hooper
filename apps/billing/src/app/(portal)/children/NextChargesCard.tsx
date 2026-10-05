import { BtnLink } from "@/src/components/ui/Btn";
import { Card, Label, Money } from "@/src/components/ui/primitives";
import { formatDate, formatMoney } from "@/src/lib/format";
import { nextCharges } from "@/src/lib/household";
import type { CardSummary } from "@/src/services/billing.service";
import type { MyPackagePurchase } from "@hooper/db";

/** The household's upcoming renewals, soonest first, and the card they'll
 * be charged to. */
export function NextChargesCard({
  purchases,
  card,
}: {
  purchases: MyPackagePurchase[];
  card: CardSummary | null;
}) {
  const upcoming = nextCharges(purchases).slice(0, 4);
  const first = upcoming[0];

  return (
    <Card>
      <Label className="mb-3">Next household charge</Label>
      {first ? (
        <>
          <Money className="text-bp-text1 text-[32px]">
            {formatMoney(first.amount_cents)}
          </Money>
          <div className="text-bp-text2 mt-1.5 mb-3 text-[12.5px]">
            {formatDate(first.current_period_end!)} for{" "}
            {`${first.athlete_first_name}'s ${first.package_name}`}
          </div>
          {upcoming.length > 1 && (
            <ul className="border-bp-border mb-3 border-t">
              {upcoming.slice(1).map((p) => (
                <li
                  key={p.id}
                  className="border-bp-border flex justify-between gap-3 border-b py-2 text-[12.5px]">
                  <span className="text-bp-text2 truncate">
                    {formatDate(p.current_period_end!)} - {p.athlete_first_name}
                  </span>
                  <span className="text-bp-text1 font-semibold tabular-nums">
                    {formatMoney(p.amount_cents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <div className="text-bp-text2 mb-3 text-[13px]">
          No upcoming renewals.
        </div>
      )}
      <div className="text-bp-text2 mb-3.5 text-[12.5px]">
        {card
          ? `Charged to ${card.brand.charAt(0).toUpperCase()}${card.brand.slice(1)} •••• ${card.last4}`
          : "No card on file"}
      </div>
      <BtnLink href="/account" variant="ghost" size="sm" full>
        Payment methods
      </BtnLink>
    </Card>
  );
}
