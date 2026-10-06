import { PurchaseList } from "@/src/components/billing/PurchaseList";
import { AlertIcon } from "@/src/components/icons";
import { BtnLink } from "@/src/components/ui/Btn";
import { Card, Label, Row } from "@/src/components/ui/primitives";
import type { CardSummary } from "@/src/services/billing.service";
import type { MyPackagePurchase } from "@hooper/db";

export function ChildBillingTab({
  firstName,
  purchases,
  error,
  card,
}: {
  firstName: string;
  purchases: MyPackagePurchase[];
  error: string | null;
  card: CardSummary | null;
}) {
  const failed = purchases.some((p) => p.status === "past_due");
  const cardLabel = card
    ? `Your account ${card.brand.charAt(0).toUpperCase()}${card.brand.slice(1)} •••• ${card.last4}`
    : "Your account has no card on file";

  return (
    <>
      {failed && (
        <Card className="border-danger/30 bg-danger/10 flex items-center gap-3">
          <AlertIcon size={19} className="text-danger shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-danger text-[13.5px] font-bold">
              A payment for {firstName} failed
            </div>
            <div className="text-bp-text2 mt-0.5 text-[12.5px]">
              Update your card and Stripe will retry automatically.
            </div>
          </div>
          <BtnLink href="/account" variant="primary" size="sm">
            Update card
          </BtnLink>
        </Card>
      )}
      <Card>
        <Label className="mb-1.5">{firstName}&apos;s packages</Label>
        {error && <div className="text-danger py-3 text-[13px]">{error}</div>}
        {!error && purchases.length === 0 && (
          <div className="text-bp-text2 py-3 text-[13.5px] leading-normal">
            No packages yet — open your coach&apos;s package link and choose
            “For my child” → {firstName} at checkout.
          </div>
        )}
        <PurchaseList purchases={purchases} />
        <div className="border-bp-border mt-1 border-t">
          <Row label="Billed to" value={cardLabel} last />
        </div>
      </Card>
    </>
  );
}
