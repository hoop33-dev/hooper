"use client";

import { signOut } from "@/src/app/(auth)/actions";
import { cn } from "@/src/lib/cn";
import type { CoachProfile } from "@/src/services/auth.service";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactElement } from "react";
import {
  ClipboardIcon,
  DumbbellIcon,
  HomeIcon,
  LayersIcon,
  LibraryIcon,
  LogOutIcon,
  StackIcon,
  UsersIcon,
} from "./ui/icons";

function ChevronIcon({
  size = 11,
  color = "currentColor",
  expanded,
}: {
  size?: number;
  color?: string;
  expanded: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        "ml-auto flex-shrink-0 transition-transform",
        expanded && "rotate-90",
      )}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

type IconComponent = (props: { size?: number; color?: string }) => ReactElement;

interface LeafNavItem {
  id: string;
  label: string;
  href: string;
  Icon: IconComponent;
  active: boolean;
}

interface ParentNavItem {
  id: string;
  label: string;
  Icon: IconComponent;
  active: boolean;
  children: LeafNavItem[];
}

type NavItem = LeafNavItem | ParentNavItem;

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    Icon: HomeIcon,
    active: true,
  },
  {
    id: "programs",
    label: "Programs",
    href: "/programs",
    Icon: LayersIcon,
    active: true,
  },
  {
    id: "athletes",
    label: "Athletes",
    href: "/athletes",
    Icon: UsersIcon,
    active: true,
  },
  {
    id: "forms",
    label: "Forms",
    href: "/forms",
    Icon: ClipboardIcon,
    active: true,
  },
  {
    id: "library",
    label: "Library",
    Icon: LibraryIcon,
    active: true,
    children: [
      {
        id: "exercises",
        label: "Exercises",
        href: "/exercises",
        Icon: DumbbellIcon,
        active: true,
      },
      {
        id: "blocks",
        label: "Blocks",
        href: "/blocks",
        Icon: StackIcon,
        active: true,
      },
    ],
  },
];

function SidebarHeader() {
  return (
    <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-5 py-4">
      <div className="bg-portal-orange flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg p-0.5">
        <Image
          src="/logo.png"
          alt="Hooper"
          width={24}
          height={24}
          className="rounded-md object-contain"
        />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-title text-[17px] font-black tracking-[0.12em] text-white">
          HOOPER
        </span>
        <span className="text-[10px] font-bold tracking-[0.1em] text-white/30 uppercase">
          Portal
        </span>
      </div>
    </div>
  );
}

function SidebarNavItem({
  item,
  pathname,
}: {
  item: LeafNavItem;
  pathname: string;
}) {
  const isActive = pathname.startsWith(item.href);
  const color = isActive ? "#F15825" : "rgba(255,255,255,0.42)";

  if (!item.active) {
    return (
      <div className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2.5 opacity-30">
        <item.Icon size={15} color="rgba(255,255,255,0.42)" />
        <span className="text-[13px] font-medium text-white/55">
          {item.label}
        </span>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors",
        isActive ? "bg-[rgba(241,88,37,0.13)]" : "hover:bg-white/[0.06]",
      )}>
      <item.Icon size={15} color={color} />
      <span
        className={cn(
          "text-[13px]",
          isActive ? "font-bold text-white" : "font-medium text-white/55",
        )}>
        {item.label}
      </span>
      {isActive && (
        <div className="bg-portal-orange ml-auto h-1 w-1 rounded-full" />
      )}
    </Link>
  );
}

function SidebarLibraryNavItem({
  item,
  pathname,
}: {
  item: ParentNavItem;
  pathname: string;
}) {
  const isSectionActive = item.children.some((child) =>
    pathname.startsWith(child.href),
  );
  const [expanded, setExpanded] = useState(isSectionActive);

  useEffect(() => {
    if (isSectionActive) setExpanded(true);
  }, [isSectionActive]);

  const color = isSectionActive ? "#F15825" : "rgba(255,255,255,0.42)";

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors",
          isSectionActive
            ? "bg-[rgba(241,88,37,0.13)]"
            : "hover:bg-white/[0.06]",
        )}>
        <item.Icon size={15} color={color} />
        <span
          className={cn(
            "text-[13px]",
            isSectionActive
              ? "font-bold text-white"
              : "font-medium text-white/55",
          )}>
          {item.label}
        </span>
        <ChevronIcon expanded={expanded} color={color} />
      </button>
      {expanded && (
        <div className="mt-0.5 flex flex-col gap-0.5 pl-4">
          {item.children.map((child) => (
            <SidebarNavItem key={child.id} item={child} pathname={pathname} />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarCoachFooter({ profile }: { profile: CoachProfile | null }) {
  const initials = profile
    ? `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase()
    : "??";
  const name = profile
    ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Coach"
    : "Coach";

  return (
    <div className="flex items-center gap-2.5 border-t border-white/[0.08] px-5 py-3.5">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4A7FD4] to-[#2B5AA8]">
        <span className="text-[11px] font-extrabold text-white">
          {initials}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] leading-tight font-bold text-white">
          {name}
        </div>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          title="Sign out"
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white">
          <LogOutIcon />
        </button>
      </form>
    </div>
  );
}

export function PortalSidebar({ profile }: { profile: CoachProfile | null }) {
  const pathname = usePathname();

  return (
    <aside className="bg-sidebar flex h-full w-[220px] flex-shrink-0 flex-col">
      <SidebarHeader />
      <nav className="flex flex-1 flex-col gap-0.5 p-2.5">
        {NAV_ITEMS.map((item) =>
          "children" in item ? (
            <SidebarLibraryNavItem
              key={item.id}
              item={item}
              pathname={pathname}
            />
          ) : (
            <SidebarNavItem key={item.id} item={item} pathname={pathname} />
          ),
        )}
      </nav>
      <SidebarCoachFooter profile={profile} />
    </aside>
  );
}
