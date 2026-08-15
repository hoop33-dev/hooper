import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { SkeletonTable } from "@/src/components/portal/ui/Skeleton";
import Link from "next/link";

export default function CategoriesLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Exercise Library"
        subtitle="Manage categories to organise your exercises"
        action={
          <Link
            href="/exercises"
            className="border-portal-border bg-portal-card text-portal-text1 hover:bg-portal-border/50 inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-sm font-semibold transition">
            <svg
              className="text-portal-text2 h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to exercises
          </Link>
        }
      />
      <SkeletonTable />
    </div>
  );
}
