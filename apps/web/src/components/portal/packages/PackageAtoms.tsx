"use client";

import { cn } from "@/src/lib/cn";
import type { PackageCoachRef } from "@hooper/db";
import { PackageIcon } from "../ui/icons";

export function coachName(coach: PackageCoachRef): string {
  return (
    [coach.first_name, coach.last_name].filter(Boolean).join(" ") ||
    coach.username ||
    "Unnamed coach"
  );
}

function coachInitials(coach: PackageCoachRef): string {
  const initials = [coach.first_name, coach.last_name]
    .map((n) => n?.trim().charAt(0) ?? "")
    .join("")
    .toUpperCase();
  return initials || coachName(coach).charAt(0).toUpperCase();
}

export function PackageTile({ size = 36 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="bg-sidebar flex flex-shrink-0 items-center justify-center rounded-lg">
      <PackageIcon size={Math.round(size * 0.46)} color="#F15825" />
    </div>
  );
}

export function CoachAvatar({
  coach,
  size = 30,
  className,
}: {
  coach: PackageCoachRef;
  size?: number;
  className?: string;
}) {
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      title={coachName(coach)}
      className={cn(
        "flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#4A7FD4] to-[#2B5AA8] font-extrabold text-white",
        className,
      )}>
      {coach.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coach.avatar_url}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        coachInitials(coach)
      )}
    </div>
  );
}

/** Label typography without layout — for labels that share a row. */
export const packageLabelTextClass =
  "text-portal-text3 text-xs font-semibold tracking-[0.08em] uppercase";

export const packageLabelClass = `${packageLabelTextClass} mb-2 block`;

/** Bordered 40px field shell. Variants swap whole classes rather than
 * appending overrides — `cn` doesn't merge conflicting Tailwind classes. */
export function packageFieldClass({
  error = false,
  muted = false,
  prefixed = false,
}: {
  /** Red border (validation failure). */
  error?: boolean;
  /** Read-only look (e.g. "Never expires"). */
  muted?: boolean;
  /** Leading static text flush against the input — no gap, no right
   * padding (the input supplies its own). */
  prefixed?: boolean;
} = {}): string {
  return cn(
    "flex h-10 w-full items-center rounded-lg border text-sm",
    error
      ? "border-red-400 focus-within:border-red-400"
      : "border-portal-border focus-within:border-portal-orange",
    muted
      ? "bg-portal-bg text-portal-text2 font-semibold"
      : "bg-portal-card text-portal-text1",
    prefixed ? "pl-3" : "gap-1.5 px-3",
  );
}
