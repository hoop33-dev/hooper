import { Pulse } from "@/src/components/shell/Skeletons";
import { Label, Tag, type TagTone } from "@/src/components/ui/primitives";
import { formatDate, formatMoney } from "@/src/lib/format";
import {
  listInvoices,
  type InvoiceSummary,
} from "@/src/services/billing.service";
import type { ReactNode } from "react";

const STATUS: Record<InvoiceSummary["status"], [string, TagTone]> = {
  paid: ["Paid", "green"],
  failed: ["Failed", "danger"],
  due: ["Due", "amber"],
};

const COLS = "md:grid-cols-[1.1fr_2fr_1fr_0.9fr_90px]";

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="border-bp-border bg-bp-card min-w-0 overflow-hidden rounded-xl border">
      <div className="border-bp-border text-bp-text1 border-b px-5 py-[15px] text-sm font-bold">
        Invoices
      </div>
      {children}
    </div>
  );
}

/** Design `InvoiceTable`, fed by the caller's Stripe invoices and one-off
 * receipts. Each row opens Stripe's hosted invoice or receipt. */
export async function InvoiceTable() {
  const res = await listInvoices();
  if (!res.ok) {
    return (
      <Frame>
        <div className="text-danger px-5 py-4 text-[13px]">
          Couldn&apos;t load invoices: {res.error}
        </div>
      </Frame>
    );
  }
  if (res.data.length === 0) {
    return (
      <Frame>
        <div className="text-bp-text2 px-5 py-4 text-[13.5px]">
          No invoices yet.
        </div>
      </Frame>
    );
  }
  return (
    <Frame>
      <div
        className={`border-bp-border hidden gap-3 border-b px-5 py-[11px] md:grid ${COLS}`}>
        {["Invoice", "Description", "Date", "Amount", ""].map((h) => (
          <Label key={h}>{h}</Label>
        ))}
      </div>
      <ul>
        {res.data.map((inv) => (
          <InvoiceRow key={inv.id} inv={inv} />
        ))}
      </ul>
    </Frame>
  );
}

function InvoiceRow({ inv }: { inv: InvoiceSummary }) {
  const [label, tone] = STATUS[inv.status];
  const number = inv.number ?? "Receipt";
  const body = (
    <>
      {/* Mobile: description over number + date, amount and status right. */}
      <div className="flex items-center gap-3 md:hidden">
        <div className="min-w-0 flex-1">
          <div className="text-bp-text1 truncate text-[13.5px] font-semibold">
            {inv.description}
          </div>
          <div className="text-bp-text3 mt-0.5 text-[11.5px]">
            {number}, {formatDate(inv.date)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-bp-text1 text-sm font-bold tabular-nums">
            {formatMoney(inv.amountCents)}
          </div>
          <div className="mt-1">
            <Tag tone={tone}>{label}</Tag>
          </div>
        </div>
      </div>
      <div className={`hidden items-center gap-3 md:grid ${COLS}`}>
        <span className="text-bp-text1 truncate text-[13px] font-semibold tabular-nums">
          {number}
        </span>
        <span className="text-bp-text2 truncate text-[13px]">
          {inv.description}
        </span>
        <span className="text-bp-text2 text-[13px]">
          {formatDate(inv.date)}
        </span>
        <span className="text-bp-text1 text-[13.5px] font-bold tabular-nums">
          {formatMoney(inv.amountCents)}
        </span>
        <span className="flex justify-end">
          <Tag tone={tone}>{label}</Tag>
        </span>
      </div>
    </>
  );
  const row = "block px-4 py-3.5 md:px-5";
  return (
    <li className="border-bp-border border-b last:border-b-0">
      {inv.url ? (
        <a
          href={inv.url}
          target="_blank"
          rel="noreferrer"
          className={`${row} hover:bg-bp-bg/60`}>
          {body}
        </a>
      ) : (
        <div className={row}>{body}</div>
      )}
    </li>
  );
}

/** Placeholder while Stripe answers. */
export function InvoiceTableSkeleton() {
  return (
    <Frame>
      <div className="flex flex-col gap-4 px-5 py-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <Pulse className="h-3 w-24" />
            <Pulse className="h-3 flex-1" />
            <Pulse className="h-3 w-16" />
          </div>
        ))}
      </div>
    </Frame>
  );
}
