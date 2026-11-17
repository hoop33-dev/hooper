"use client";

import type { ReactNode } from "react";
import { PortalButton } from "./PortalButton";

/** Case-insensitive substring match of `query` against any of `fields`. An
 * empty (or whitespace-only) query matches everything. */
export function matchesSearch(
  query: string,
  ...fields: (string | null | undefined)[]
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => f?.toLowerCase().includes(q));
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <svg
        className="text-portal-text3 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-portal-border bg-portal-card text-portal-text1 placeholder:text-portal-text3 focus:border-portal-orange h-9 w-64 rounded-lg border pr-3 pl-9 text-sm focus:outline-none"
      />
    </div>
  );
}

export function CreateButton({
  onClick,
  label = "Create",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <PortalButton variant="primary" onClick={onClick}>
      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
      </svg>
      {label}
    </PortalButton>
  );
}

/**
 * The sub-heading row under a list page's `PageHeader`: left-side filters
 * (`children`), then a right-aligned search input and optional create button.
 * Shared by every portal list page so the row sits at the same height and
 * layout everywhere.
 */
export function ListToolbar({
  children,
  search,
  onSearchChange,
  searchPlaceholder,
  onCreate,
}: {
  children?: ReactNode;
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder: string;
  onCreate?: () => void;
}) {
  return (
    <div className="border-portal-border bg-portal-card flex flex-shrink-0 flex-wrap items-center gap-3 border-b px-7 py-3">
      {children}
      <div className="ml-auto flex flex-shrink-0 items-center gap-3">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
        {onCreate && <CreateButton onClick={onCreate} />}
      </div>
    </div>
  );
}

/** Loading placeholder matching `ListToolbar`. `children` are the left-side
 * filter placeholders. */
export function ListToolbarSkeleton({
  children,
  create = true,
}: {
  children?: ReactNode;
  create?: boolean;
}) {
  return (
    <div className="border-portal-border bg-portal-card flex flex-shrink-0 flex-wrap items-center gap-3 border-b px-7 py-3">
      {children}
      <div className="ml-auto flex items-center gap-3">
        <div className="bg-portal-border/50 h-9 w-64 animate-pulse rounded-lg" />
        {create && (
          <div className="bg-portal-border/50 h-9 w-24 animate-pulse rounded-lg" />
        )}
      </div>
    </div>
  );
}
