import { signOutAction } from "@/src/app/(auth)/actions";
import { APP_LINK } from "@/src/components/app/AppLinks";
import {
  ArrowIcon,
  ChevronIcon,
  DumbbellIcon,
  LogoutIcon,
} from "@/src/components/icons";
import { MobileLinks, SidebarLinks } from "@/src/components/shell/NavLinks";
import { LogoMark } from "@/src/components/ui/Logo";
import { Avatar, Title } from "@/src/components/ui/primitives";
import { AppLink } from "@hooper/shared/next";
import type { ReactNode } from "react";

export type ShellUser = { name: string; initials: string; label: string };

/** Light portal chrome: dark app-promo bar, dark sidebar (desktop) or bottom
 * nav (mobile), light content area. On desktop the shell is pinned to the
 * viewport and only the content column scrolls, so the sidebar fills exactly
 * the space under the app bar. */
export function Shell({
  user,
  children,
}: {
  user: ShellUser;
  children: ReactNode;
}) {
  return (
    <div className="bg-bp-bg flex min-h-screen flex-col font-sans md:h-dvh md:min-h-0">
      <AppBar />
      <div className="flex flex-1 md:min-h-0">
        <Sidebar user={user} />
        <div className="flex min-w-0 flex-1 flex-col pb-[62px] md:overflow-y-auto md:pb-0">
          {children}
        </div>
      </div>
      <MobileNav />
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

function Sidebar({ user }: { user: ShellUser }) {
  return (
    <aside className="bg-ink hidden w-[218px] shrink-0 flex-col md:flex">
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-5 pt-4 pb-3.5">
        <LogoMark size={28} />
        <span className="font-title tracking-title text-[17px] font-black text-white uppercase">
          Hooper
        </span>
        <span className="ml-auto text-[9.5px] font-bold tracking-[0.1em] text-white/30 uppercase">
          Billing
        </span>
      </div>
      <SidebarLinks />
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

function MobileNav() {
  return (
    <nav className="bg-ink fixed inset-x-0 bottom-0 flex h-[62px] border-t border-white/[0.08] pb-1.5 md:hidden">
      <MobileLinks />
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
export type Crumb = { label: string; href?: string };

/** Page header: optional back strip with breadcrumbs (design `NavStrip`),
 * then title + sub (sub hidden on mobile) + actions. */
export function TopBar({
  title,
  sub,
  right,
  back,
  crumbs,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
  back?: { href: string; label: string };
  crumbs?: Crumb[];
}) {
  return (
    <>
      {back && <BackStrip back={back} crumbs={crumbs} />}
      <div className="border-bp-border bg-bp-card flex shrink-0 items-center justify-between gap-3.5 border-b px-[18px] py-3.5 md:items-start md:px-7 md:pt-5 md:pb-[18px]">
        <div className="min-w-0">
          <Title className="truncate text-[19px] md:text-[22px]">{title}</Title>
          {sub && (
            <div className="text-bp-text2 mt-[3px] hidden text-[13px] md:block">
              {sub}
            </div>
          )}
        </div>
        {right && (
          <div className="flex shrink-0 items-center gap-2">{right}</div>
        )}
      </div>
    </>
  );
}

export function BackStrip({
  back,
  crumbs,
}: {
  back: { href: string; label: string };
  crumbs?: Crumb[];
}) {
  return (
    <div className="border-bp-border bg-bp-card flex h-[42px] shrink-0 items-center justify-between gap-3.5 border-b px-4 md:h-[46px] md:px-7">
      <AppLink
        href={back.href}
        className="text-bp-text1 flex min-w-0 items-center gap-[9px]">
        <ChevronIcon size={16} dir="left" />
        <span className="text-[11.5px] font-bold tracking-[0.12em] uppercase">
          {back.label}
        </span>
      </AppLink>
      {crumbs && (
        <nav
          aria-label="Breadcrumb"
          className="hidden min-w-0 items-center gap-2 md:flex">
          {crumbs.map((c, i) => (
            <span
              key={c.label}
              className="flex min-w-0 items-center gap-2 text-[12.5px]">
              {i > 0 && <span className="text-bp-text3">/</span>}
              {c.href ? (
                <AppLink
                  href={c.href}
                  className="text-bp-text2 truncate font-medium">
                  {c.label}
                </AppLink>
              ) : (
                <span className="text-bp-text1 truncate font-bold">
                  {c.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}
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
