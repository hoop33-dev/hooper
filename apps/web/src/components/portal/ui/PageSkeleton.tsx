import type { ReactNode } from "react";
import { PageHeader } from "./PageHeader";

interface PageSkeletonProps {
  title: string;
  subtitle?: string;
  /** Placeholder button in the header's action slot — for pages whose create
   * button lives in the header (forms). */
  headerAction?: boolean;
  /** Render the create bar that sits between the header and the list on the
   * programs / teams / blocks pages. */
  toolbar?: boolean;
  /** Add the filter-pills placeholder to the left of the toolbar (programs). */
  toolbarFilter?: boolean;
  children: ReactNode;
}

/**
 * Loading shell for the top-level portal list pages: the real `<PageHeader />`
 * (cheap, static) rendered immediately with a placeholder body beneath it.
 * Keeps the header identical to the loaded page so nothing shifts on swap.
 */
export function PageSkeleton({
  title,
  subtitle,
  headerAction = false,
  toolbar = false,
  toolbarFilter = false,
  children,
}: PageSkeletonProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          headerAction ? (
            <div className="bg-portal-border/40 h-9 w-32 animate-pulse rounded-lg" />
          ) : undefined
        }
      />
      {toolbar && (
        <div className="border-portal-border bg-portal-card flex flex-shrink-0 items-center gap-3 border-b px-7 py-4">
          {toolbarFilter && (
            <div className="bg-portal-border/50 h-8 w-48 animate-pulse rounded-lg" />
          )}
          <div className="bg-portal-border/40 ml-auto h-9 w-32 animate-pulse rounded-lg" />
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-7 py-2">{children}</div>
    </div>
  );
}
