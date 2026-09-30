"use client";

import { cn } from "@/src/lib/cn";
import type { PackageCoachRef } from "@hooper/db";
import type { ReactNode } from "react";
import { PackageIcon, XIcon } from "../ui/icons";
import { useModalDismiss } from "../ui/useModalDismiss";

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

/** Centered modal card with the portal's standard header — shared by the
 * package create, add-item and delete modals. */
export function PackageModal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const onBackdropClick = useModalDismiss(onClose);
  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-portal-card flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl shadow-2xl">
        <div className="border-portal-border flex items-center justify-between border-b px-6 py-4">
          <div className="min-w-0">
            <h2 className="font-title text-portal-text1 text-lg font-extrabold tracking-wide">
              {title}
            </h2>
            {subtitle && (
              <p className="text-portal-text3 truncate text-xs">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="border-portal-border text-portal-text2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border">
            <XIcon />
          </button>
        </div>
        {children}
      </div>
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
