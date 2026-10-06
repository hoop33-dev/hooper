"use client";

import type { AthleteSummary } from "@hooper/db";
import { useState } from "react";
import { ListToolbar, matchesSearch } from "../ui/ListToolbar";
import { AthletesTable } from "./AthletesTable";

interface AthletesListShellProps {
  athletes: AthleteSummary[];
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 py-20 text-center">
      <p className="text-portal-text1 font-semibold">
        {hasSearch ? "No athletes match your search" : "No athletes yet"}
      </p>
      <p className="text-portal-text3 text-sm">
        {hasSearch
          ? "Try a different search"
          : "Athletes will appear here once they sign up in the app"}
      </p>
    </div>
  );
}

export function AthletesListShell({ athletes }: AthletesListShellProps) {
  const [search, setSearch] = useState("");
  const filtered = athletes.filter((a) =>
    matchesSearch(
      search,
      [a.first_name, a.last_name].filter(Boolean).join(" "),
      a.username,
    ),
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search athletes…"
      />
      <div className="flex-1 overflow-y-auto px-7 py-4">
        {filtered.length === 0 ? (
          <EmptyState hasSearch={athletes.length > 0} />
        ) : (
          <AthletesTable athletes={filtered} />
        )}
      </div>
    </div>
  );
}
