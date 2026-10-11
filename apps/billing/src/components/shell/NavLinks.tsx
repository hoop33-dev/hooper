"use client";

import {
  CalendarIcon,
  HomeIcon,
  SettingsIcon,
  UsersIcon,
} from "@/src/components/icons";
import { cn } from "@/src/lib/cn";
import { AppLink } from "@hooper/shared/next";
import { usePathname } from "next/navigation";

/** Portal nav, in the design's order. Activity slots in after Memberships
 * once it's built. */
const NAV = [
  { href: "/", label: "Overview", Icon: HomeIcon },
  { href: "/memberships", label: "Memberships", Icon: CalendarIcon },
  { href: "/children", label: "Children", Icon: UsersIcon },
  { href: "/account", label: "Account", Icon: SettingsIcon },
] as const;

function useActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);
}

/** `alerts` (failed charges) badges Overview, like the design. */
export function SidebarLinks({ alerts }: { alerts: number }) {
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
            {href === "/" && alerts > 0 && (
              <span
                aria-label={`${alerts} failed ${alerts === 1 ? "charge" : "charges"}`}
                className="bg-orange ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-[5px] text-[10.5px] font-extrabold text-white">
                {alerts}
              </span>
            )}
          </AppLink>
        );
      })}
    </nav>
  );
}

export function MobileLinks({ alerts }: { alerts: number }) {
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
            className="relative flex flex-1 flex-col items-center justify-center gap-1">
            <Icon size={17} className={on ? "text-orange" : "text-white/40"} />
            <span
              className={cn(
                "text-[9.5px]",
                on ? "font-bold text-white" : "font-medium text-white/45",
              )}>
              {label}
            </span>
            {href === "/" && alerts > 0 && (
              <span className="bg-orange absolute top-1.5 left-1/2 ml-1.5 flex size-[15px] items-center justify-center rounded-full text-[9.5px] font-extrabold text-white">
                {alerts}
              </span>
            )}
          </AppLink>
        );
      })}
    </>
  );
}
