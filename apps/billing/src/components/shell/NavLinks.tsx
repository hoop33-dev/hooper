"use client";

import { SettingsIcon, UsersIcon } from "@/src/components/icons";
import { cn } from "@/src/lib/cn";
import { AppLink } from "@hooper/shared/next";
import { usePathname } from "next/navigation";

/** Portal nav, in the design's order. Overview, Payments and Activity slot
 * in ahead of these as they're built. */
const NAV = [
  { href: "/children", label: "Children", Icon: UsersIcon },
  { href: "/account", label: "Account", Icon: SettingsIcon },
] as const;

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarLinks() {
  const isActive = useActive();
  return (
    <nav className="flex flex-1 flex-col gap-px p-2.5">
      {NAV.map(({ href, label, Icon }) => {
        const on = isActive(href);
        return (
          <AppLink
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-[9px] text-[13px]",
              on
                ? "bg-orange/13 font-bold text-white"
                : "font-medium text-white/55 hover:text-white/80",
            )}>
            <Icon size={17} className={on ? "text-orange" : "text-white/40"} />
            {label}
          </AppLink>
        );
      })}
    </nav>
  );
}

export function MobileLinks() {
  const isActive = useActive();
  return (
    <>
      {NAV.map(({ href, label, Icon }) => {
        const on = isActive(href);
        return (
          <AppLink
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className="flex flex-1 flex-col items-center justify-center gap-1">
            <Icon size={17} className={on ? "text-orange" : "text-white/40"} />
            <span
              className={cn(
                "text-[9.5px]",
                on ? "font-bold text-white" : "font-medium text-white/45",
              )}>
              {label}
            </span>
          </AppLink>
        );
      })}
    </>
  );
}
