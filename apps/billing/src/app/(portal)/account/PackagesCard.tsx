import { PurchaseList } from "@/src/components/billing/PurchaseList";
import { Card, Label } from "@/src/components/ui/primitives";
import { visiblePurchases } from "@/src/lib/purchases";
import type { MyPackagePurchase } from "@hooper/db";

/** The signed-in user's own packages. Packages bought for children live on
 * the Household tab, so the caller filters to their own athlete id. */
export function PackagesCard({
  purchases,
  error,
}: {
  purchases: MyPackagePurchase[];
  error: string | null;
}) {
  const shown = visiblePurchases(purchases);

  return (
    <Card>
      <Label className="mb-1.5">Your packages</Label>
      {error && <div className="text-danger py-3 text-[13px]">{error}</div>}
      {!error && shown.length === 0 && (
        <div className="text-bp-text2 py-3 text-[13.5px]">
          No packages yet. Your coach will send you a link to buy one.
        </div>
      )}
      <PurchaseList purchases={shown} />
    </Card>
  );
}
