import { signOutAction } from "@/src/app/(auth)/actions";
import { APP_LINK } from "@/src/components/app/AppLinks";
import {
  ArrowIcon,
  DumbbellIcon,
  LogoutIcon,
  SettingsIcon,
} from "@/src/components/icons";
import { Avatar, Title } from "@/src/components/ui/primitives";
import { cn } from "@/src/lib/cn";
import Link from "next/link";
import type { ReactNode } from "react";

/** Portal nav. Only Account exists in v1 — Overview, Payments and Activity
 * from the design slot in here as they're built. */
const NAV = [
  { href: "/account", label: "Account", Icon: SettingsIcon },
] as const;

export type ShellUser = { name: string; initials: string; label: string };

/** Light portal chrome: dark app-promo bar, dark sidebar (desktop) or bottom
 * nav (mobile), light content area. */
export function Shell({
  user,
  active,
  children,
}: {
  user: ShellUser;
  active: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-bp-bg flex min-h-screen flex-col font-sans">
      <AppBar />
      <div className="flex flex-1">
        <Sidebar user={user} active={active} />
        <div className="flex min-w-0 flex-1 flex-col pb-[62px] md:pb-0">
          {children}
        </div>
      </div>
      <MobileNav active={active} />
    </div>
  );
}

function AppBar() {
  return (
    <div className="bg-ink flex shrink-0 items-center gap-3 px-4 py-2.5 md:h-[46px] md:px-6 md:py-0">
      <div className="bg-orange flex size-[22px] shrink-0 items-center justify-center rounded-md text-white">
        <DumbbellIcon size={12} />
      </div>
      <span className="min-w-0 flex-1 truncate text-[12.5px] text-white/70">
        <span className="md:hidden">Training lives in the app</span>
        <span className="hidden md:inline">
          Training, sessions and messaging all live in the Hooper app
        </span>
      </span>
      <a
        href={APP_LINK}
        target="_blank"
        rel="noreferrer"
        className="bg-orange flex h-[26px] shrink-0 items-center gap-[5px] rounded-full px-3 text-[11.5px] font-bold text-white">
        Open app <ArrowIcon size={12} />
      </a>
    </div>
  );
}

function Sidebar({ user, active }: { user: ShellUser; active: string }) {
  return (
    <aside className="bg-ink sticky top-0 hidden h-screen w-[218px] shrink-0 flex-col md:flex">
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-5 pt-4 pb-3.5">
        <div className="bg-orange flex size-7 items-center justify-center rounded-lg text-white">
          <DumbbellIcon size={15} />
        </div>
        <span className="font-title tracking-title text-[17px] font-black text-white uppercase">
          Hooper
        </span>
        <span className="ml-auto text-[9.5px] font-bold tracking-[0.1em] text-white/30 uppercase">
          Billing
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-px p-2.5">
        {NAV.map(({ href, label, Icon }) => {
          const on = href === active;
          return (
            <Link
              key={href}
              href={href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-[9px] text-[13px]",
                on
                  ? "bg-orange/13 font-bold text-white"
                  : "font-medium text-white/55",
              )}>
              <Icon
                size={17}
                className={on ? "text-orange" : "text-white/40"}
              />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-2.5 border-t border-white/[0.08] px-3.5 py-3">
        <Avatar initials={user.initials} size={30} tone="navy" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs leading-[1.3] font-bold text-white">
            {user.name}
          </div>
          <div className="text-[10px] text-white/40">{user.label}</div>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            aria-label="Sign out"
            title="Sign out"
            className="rounded-md p-1.5 text-white/40 hover:text-white">
            <LogoutIcon size={16} />
          </button>
        </form>
      </div>
    </aside>
  );
}

function MobileNav({ active }: { active: string }) {
  return (
    <nav className="bg-ink fixed inset-x-0 bottom-0 flex h-[62px] border-t border-white/[0.08] pb-1.5 md:hidden">
      {NAV.map(({ href, label, Icon }) => {
        const on = href === active;
        return (
          <Link
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
          </Link>
        );
      })}
      <form action={signOutAction} className="flex flex-1">
        <button
          type="submit"
          className="flex flex-1 flex-col items-center justify-center gap-1">
          <LogoutIcon size={17} className="text-white/40" />
          <span className="text-[9.5px] font-medium text-white/45">
            Sign out
          </span>
        </button>
      </form>
    </nav>
  );
}

/** Page header strip: title + optional sub (hidden on mobile) + actions. */
export function TopBar({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="border-bp-border bg-bp-card flex shrink-0 items-center justify-between gap-3.5 border-b px-[18px] py-3.5 md:items-start md:px-7 md:pt-5 md:pb-[18px]">
      <div className="min-w-0">
        <Title className="text-[19px] md:text-[22px]">{title}</Title>
        {sub && (
          <div className="text-bp-text2 mt-[3px] hidden text-[13px] md:block">
            {sub}
          </div>
        )}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  );
}

export function PageBody({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 px-4 pt-[18px] pb-7 md:px-7 md:pt-6 md:pb-8">
      {children}
    </div>
  );
}
