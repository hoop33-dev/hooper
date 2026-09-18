"use client";

import type { AthleteSummary } from "@hooper/db";
import { AthletesTable } from "./AthletesTable";

interface AthletesListShellProps {
  athletes: AthleteSummary[];
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 py-20 text-center">
      <p className="text-portal-text1 font-semibold">No athletes yet</p>
      <p className="text-portal-text3 text-sm">
        Athletes will appear here once they sign up in the app
      </p>
    </div>
  );
}

export function AthletesListShell({ athletes }: AthletesListShellProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-7 py-4">
        {athletes.length === 0 ? (
          <EmptyState />
        ) : (
          <AthletesTable athletes={athletes} />
        )}
      </div>
    </div>
  );
}
