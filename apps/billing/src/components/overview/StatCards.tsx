import { Money } from "@/src/components/ui/primitives";
import { cn } from "@/src/lib/cn";
import { AppLink } from "@hooper/shared/next";

export type Stat = {
  value: string;
  label: string;
  sub: string;
  href: string;
  /** Orange highlight — money is owed. */
  alert?: boolean;
};

/** Design OverviewB's three summary cards. */
export function StatCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
      {stats.map((s) => (
        <AppLink
          key={s.label}
          href={s.href}
          className={cn(
            "rounded-xl border p-[18px] transition-colors",
            s.alert
              ? "border-orange/25 bg-orange/10"
              : "border-bp-border bg-bp-card hover:bg-bp-bg/60",
          )}>
          <Money
            className={cn(
              "text-[30px]",
              s.alert ? "text-orange" : "text-bp-text1",
            )}>
            {s.value}
          </Money>
          <div className="text-bp-text1 mt-2 text-[13px] font-bold">
            {s.label}
          </div>
          <div className="text-bp-text3 mt-0.5 truncate text-xs">{s.sub}</div>
        </AppLink>
      ))}
    </div>
  );
}
