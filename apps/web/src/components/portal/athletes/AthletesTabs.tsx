"use client";

import { AppLink } from "@/src/components/portal/ui/AppLink";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/athletes", label: "Athletes" },
  { href: "/athletes/teams", label: "Teams" },
] as const;

/** Route-driven, unlike LibraryTabs' controlled active/onChange — /athletes
 * and /athletes/teams are real pages, not a client-state toggle. The
 * Athletes tab needs an exact pathname match: startsWith("/athletes") would
 * also match "/athletes/teams" and light up both tabs at once. */
export function AthletesTabs() {
  const pathname = usePathname();

  return (
    <div className="bg-portal-bg border-portal-border inline-flex gap-1 rounded-lg border p-1">
      {TABS.map((tab) => {
        const active =
          tab.href === "/athletes"
            ? pathname === "/athletes"
            : pathname.startsWith(tab.href);
        return (
          <AppLink
            key={tab.href}
            href={tab.href}
            className={`flex h-7 items-center rounded-md px-4 text-xs font-bold transition ${
              active
                ? "bg-portal-orange text-white"
                : "text-portal-text3 hover:bg-portal-border/50"
            }`}>
            {tab.label}
          </AppLink>
        );
      })}
    </div>
  );
}
