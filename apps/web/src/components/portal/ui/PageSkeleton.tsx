import type { ReactNode } from "react";
import { ListToolbarSkeleton } from "./ListToolbar";
import { PageHeader } from "./PageHeader";

interface PageSkeletonProps {
  title: string;
  subtitle?: string;
  /** Render the search/create toolbar that sits between the header and the
   * list on the list pages (see `ListToolbar`). */
  toolbar?: boolean;
  /** Add the filter-pills placeholder to the left of the toolbar (programs). */
  toolbarFilter?: boolean;
  /** Include the create-button placeholder in the toolbar. */
  toolbarCreate?: boolean;
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
  toolbar = false,
  toolbarFilter = false,
  toolbarCreate = true,
  children,
}: PageSkeletonProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader title={title} subtitle={subtitle} />
      {toolbar && (
        <ListToolbarSkeleton create={toolbarCreate}>
          {toolbarFilter && (
            <div className="bg-portal-border/50 h-8 w-48 animate-pulse rounded-lg" />
          )}
        </ListToolbarSkeleton>
      )}
      <div className="flex-1 overflow-y-auto px-7 py-2">{children}</div>
    </div>
  );
}
