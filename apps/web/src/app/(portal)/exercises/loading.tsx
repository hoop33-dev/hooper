import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { PortalButton } from "@/src/components/portal/ui/PortalButton";
import { SkeletonTable } from "@/src/components/portal/ui/Skeleton";
import Link from "next/link";

/** Mirrors LibraryToolbar's static chrome (ExerciseLibraryShell) — no
 * category data or handlers wired up since it's inert until the real
 * shell hydrates, but the buttons/labels themselves don't depend on the
 * fetch so there's no reason to skeleton-pulse them. */
function ToolbarLink({
  href,
  d,
  children,
}: {
  href: string;
  d: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="border-portal-border bg-portal-card text-portal-text1 hover:bg-portal-border/50 inline-flex h-9 flex-shrink-0 items-center gap-1.5 rounded-lg border px-4 text-sm font-semibold whitespace-nowrap transition">
      <svg
        className="text-portal-text2 h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
      </svg>
      {children}
    </Link>
  );
}

export default function ExercisesLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Exercise Library"
        subtitle="Create and manage exercises for your training programs"
      />
      <div className="border-portal-border bg-portal-card flex flex-wrap items-center gap-3 border-b px-7 py-3">
        <button
          type="button"
          disabled
          className="border-portal-border bg-portal-card text-portal-text1 flex h-9 items-center gap-1.5 rounded-lg border px-4 text-sm font-semibold whitespace-nowrap">
          <svg
            className="text-portal-text2 h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7h18M3 12h18M3 17h10"
            />
          </svg>
          All categories
          <svg
            className="text-portal-text3 h-3.5 w-3.5"
            viewBox="0 0 20 20"
            fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <ToolbarLink href="/exercises/categories" d="M3 7h18M3 12h18M3 17h10">
          Manage categories
        </ToolbarLink>
        <ToolbarLink
          href="/exercises/styles"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z">
          Manage styles
        </ToolbarLink>
        <ToolbarLink
          href="/exercises/unit-types"
          d="M9 7h6m-6 5h6m-6 5h6M5 7h.01M5 12h.01M5 17h.01">
          Manage unit types
        </ToolbarLink>
        <div className="ml-auto flex flex-shrink-0 items-center gap-3">
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
              disabled
              placeholder="Search exercises…"
              className="border-portal-border bg-portal-card text-portal-text1 placeholder:text-portal-text3 h-9 w-64 rounded-lg border pr-3 pl-9 text-sm"
            />
          </div>
          <PortalButton variant="primary" disabled>
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 20 20"
              fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Create
          </PortalButton>
        </div>
      </div>
      <SkeletonTable />
    </div>
  );
}
