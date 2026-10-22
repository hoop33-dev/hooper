"use client";

import { retryPaymentAction } from "@/src/app/membershipActions";
import { CreditIcon, LockIcon } from "@/src/components/icons";
import { Btn } from "@/src/components/ui/Btn";
import { Money, Tag } from "@/src/components/ui/primitives";
import { formatMoney } from "@/src/lib/format";
import { useState, useTransition } from "react";

export type OutstandingItem = {
  purchaseId: string;
  title: string;
  sub: string;
  amountCents: number;
};

/** Design OverviewB "Needs attention": failed renewals with Pay now, which
 * retries the charge on the card on file. */
export function NeedsAttention({ items }: { items: OutstandingItem[] }) {
  return (
    <div className="border-bp-border bg-bp-card min-w-0 overflow-hidden rounded-xl border">
      <div className="border-bp-border flex items-center justify-between border-b px-5 py-[15px]">
        <span className="text-bp-text1 text-sm font-bold">Needs attention</span>
        <Tag tone="danger">
          {items.length} failed {items.length === 1 ? "charge" : "charges"}
        </Tag>
      </div>
      <ul className="px-4 md:px-5">
        {items.map((item) => (
          <OutstandingRow key={item.purchaseId} item={item} />
        ))}
      </ul>
      <div className="border-bp-border bg-bp-bg text-bp-text2 flex items-center gap-2.5 border-t px-5 py-3.5 text-[12.5px]">
        <LockIcon size={14} className="text-bp-text3 shrink-0" />
        Stripe keeps retrying for a while. If it still can&apos;t charge, the
        membership is cancelled — logged history stays.
      </div>
    </div>
  );
}

function OutstandingRow({ item }: { item: OutstandingItem }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function pay() {
    setError(null);
    start(async () => {
      const res = await retryPaymentAction(item.purchaseId);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <li className="border-bp-border border-b py-3.5 last:border-b-0 md:py-4">
      <div className="flex items-center gap-3.5">
        <div className="bg-danger/10 text-danger flex size-9 shrink-0 items-center justify-center rounded-[9px]">
          <CreditIcon size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-bp-text1 truncate text-sm font-bold">
            {item.title}
          </div>
          <div className="text-bp-text2 mt-0.5 truncate text-[12.5px]">
            {item.sub},{" "}
            <span className="text-danger font-semibold">payment failed</span>
          </div>
        </div>
        <Money className="text-bp-text1 shrink-0 text-[20px]">
          {formatMoney(item.amountCents)}
        </Money>
        <Btn variant="primary" size="sm" loading={pending} onClick={pay}>
          Pay now
        </Btn>
      </div>
      {error && (
        <div role="alert" className="text-danger mt-2 pl-[50px] text-[12.5px]">
          {error}
        </div>
      )}
    </li>
  );
}
