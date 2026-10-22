"use client";

import type { PackageRow, PackageSummary } from "@hooper/db";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PackageIcon } from "../ui/icons";
import { ListToolbar, matchesSearch } from "../ui/ListToolbar";
import { PortalButton } from "../ui/PortalButton";
import { useOptimisticList } from "../ui/useOptimisticList";
import {
  PackageCreateModal,
  type PackageCreateFormData,
} from "./PackageCreateModal";
import { PackagesTable } from "./PackagesTable";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

function EmptyState({
  hasSearch,
  onCreateClick,
}: {
  hasSearch: boolean;
  onCreateClick: () => void;
}) {
  if (hasSearch) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 py-20 text-center">
        <p className="text-portal-text1 font-semibold">
          No packages match your search
        </p>
        <p className="text-portal-text3 text-sm">Try a different search</p>
      </div>
    );
  }
  return (
    <div className="text-portal-text3 flex h-full flex-col items-center justify-center gap-4 py-20">
      <PackageIcon size={36} />
      <div className="text-center">
        <p className="text-portal-text1 font-semibold">No packages yet</p>
        <p className="mt-1 text-sm">
          Bundle programs and coaches into something athletes can buy.
        </p>
      </div>
      <PortalButton variant="primary" onClick={onCreateClick}>
        Create package
      </PortalButton>
    </div>
  );
}

export function PackagesListShell({
  packages,
  createAction,
  checkSlugAction,
}: {
  packages: PackageSummary[];
  createAction: (
    data: PackageCreateFormData,
  ) => Promise<ActionResult<PackageRow>>;
  checkSlugAction: (slug: string) => Promise<string | null>;
}) {
  const router = useRouter();
  const { items: localPackages, mutate } = useOptimisticList(packages);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = localPackages.filter((p) =>
    matchesSearch(search, p.name, p.slug),
  );

  async function handleCreate(
    data: PackageCreateFormData,
  ): Promise<ActionResult> {
    const result = await mutate<PackageRow>(
      (prev) => prev,
      () => createAction(data),
      (prev, row) => [{ ...row, programs: [], coaches: [] }, ...prev],
    );
    if (!result.ok || !result.data) {
      return { ok: false, error: result.error };
    }
    // Straight to the new package so programs and coaches can be added.
    router.push(`/packages/${result.data.slug}`);
    return { ok: true };
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search packages…"
        onCreate={() => setCreateOpen(true)}
      />

      <div className="flex-1 overflow-y-auto px-7 py-2">
        {filtered.length === 0 ? (
          <EmptyState
            hasSearch={localPackages.length > 0}
            onCreateClick={() => setCreateOpen(true)}
          />
        ) : (
          <PackagesTable packages={filtered} />
        )}
      </div>

      {createOpen && (
        <PackageCreateModal
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreate}
          checkSlug={checkSlugAction}
        />
      )}
    </div>
  );
}
