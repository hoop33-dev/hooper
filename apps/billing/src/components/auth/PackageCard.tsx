import { CalendarIcon } from "@/src/components/icons";
import { Avatar, Money } from "@/src/components/ui/primitives";
import {
  billingLine,
  formatMoney,
  fullName,
  gstOfCents,
  initials,
  perLabel,
  programMeta,
} from "@/src/lib/format";
import type { PublicPackage } from "@hooper/db";
import type { ReactNode } from "react";

const COACH_TONES = ["blue", "navy", "orange", "slate"] as const;

function CardLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 text-[10.5px] font-semibold tracking-[0.12em] text-white/40 uppercase">
      {children}
    </div>
  );
}

/** The checkout summary column: package name + price, programs, coaches and
 * the "Total today" footer (NZD, GST inclusive). */
export function PackageCard({
  pkg,
  forWho,
}: {
  pkg: PublicPackage;
  forWho: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
      <div className="border-b border-white/10 p-[18px] md:p-[22px]">
        <div className="mb-2 text-[10.5px] font-semibold tracking-[0.12em] text-white/40 uppercase">
          Package
        </div>
        <div className="font-title tracking-title text-[26px] leading-[1.02] font-black text-balance text-white uppercase md:text-[30px]">
          {pkg.name}
        </div>
        <div className="mt-3.5 flex items-baseline gap-2">
          <Money className="text-orange text-[36px] md:text-[42px]">
            {formatMoney(pkg.price_cents)}
          </Money>
          <span className="text-sm font-semibold text-white/60">
            {perLabel(pkg)}
          </span>
        </div>
        <div className="mt-1 text-xs text-white/40">{billingLine(pkg)}</div>
      </div>

      {pkg.programs.length > 0 && (
        <div className="border-b border-white/10 px-[18px] py-4 md:px-[22px] md:py-[18px]">
          <CardLabel>
            {pkg.programs.length === 1
              ? "Program"
              : `${pkg.programs.length} programs`}
          </CardLabel>
          <ul className="flex flex-col gap-3">
            {pkg.programs.map((p) => (
              <li key={p.name} className="flex items-start gap-[11px]">
                <div className="bg-orange/15 text-orange flex size-7 shrink-0 items-center justify-center rounded-[7px]">
                  <CalendarIcon size={14} />
                </div>
                <div className="min-w-0">
                  <div className="text-[13.5px] leading-[1.3] font-bold text-white">
                    {p.name}
                  </div>
                  <div className="text-xs text-white/40">{programMeta(p)}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pkg.coaches.length > 0 && (
        <div className="border-b border-white/10 px-[18px] py-4 md:px-[22px] md:py-[18px]">
          <CardLabel>
            {pkg.coaches.length === 1
              ? "Coach"
              : `${pkg.coaches.length} coaches`}
          </CardLabel>
          <ul className="flex flex-col gap-2.5">
            {pkg.coaches.map((c, i) => (
              <li
                key={`${c.first_name}-${c.last_name}-${i}`}
                className="flex items-center gap-[11px]">
                <Avatar
                  initials={initials(c.first_name, c.last_name)}
                  size={28}
                  tone={COACH_TONES[i % COACH_TONES.length]}
                />
                <div className="text-[13.5px] font-semibold text-white">
                  {fullName(c.first_name, c.last_name)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="px-[18px] pt-3.5 pb-[18px] md:px-[22px] md:pt-4 md:pb-5">
        <div className="mb-2.5 flex justify-between gap-3 text-[13px]">
          <span className="text-white/60">For</span>
          <span className="text-right font-semibold text-white">{forWho}</span>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[13px] text-white/60">Total today</div>
            <div className="text-[11px] text-white/40">
              NZD, incl. GST {formatMoney(gstOfCents(pkg.price_cents))}
            </div>
          </div>
          <Money className="text-[26px] text-white">
            {formatMoney(pkg.price_cents)}
          </Money>
        </div>
      </div>
    </div>
  );
}

/** Form column + sticky package summary (summary first on mobile). Renders
 * just the children when no package is being bought. */
export function CheckoutLayout({
  pkg,
  forWho,
  children,
}: {
  pkg: PublicPackage | null;
  forWho: string;
  children: ReactNode;
}) {
  if (!pkg) return <>{children}</>;
  return (
    <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1fr)_360px] md:gap-10">
      <div className="md:hidden">
        <PackageCard pkg={pkg} forWho={forWho} />
      </div>
      <div className="min-w-0">{children}</div>
      <div className="sticky top-6 hidden md:block">
        <PackageCard pkg={pkg} forWho={forWho} />
      </div>
    </div>
  );
}
