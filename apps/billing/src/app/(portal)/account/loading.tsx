import { CardSkeleton, PageSkeleton } from "@/src/components/shell/Skeletons";

/** Mirrors `AccountPage`; the Stripe payment-method lookup makes this one of
 * the slower pages. */
export default function AccountLoading() {
  return (
    <PageSkeleton
      title="Account"
      sub="Your details, packages and payment method">
      <div className="grid grid-cols-1 items-start gap-[18px] lg:grid-cols-[1.5fr_1fr]">
        <div className="flex min-w-0 flex-col gap-4">
          <CardSkeleton rows={4} />
          <CardSkeleton rows={3} />
        </div>
        <div className="flex min-w-0 flex-col gap-3.5">
          <CardSkeleton rows={2} />
          <CardSkeleton rows={1} />
        </div>
      </div>
    </PageSkeleton>
  );
}
