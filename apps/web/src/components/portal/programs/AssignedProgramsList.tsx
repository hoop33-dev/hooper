"use client";

import type { AssignmentWithProgram } from "@hooper/db";
import Link from "next/link";
import { InlineConfirmDelete } from "../ui/InlineConfirmDelete";
import { ProgramStatusBadge } from "./ProgramStatusBadge";

function formatStartDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface AssignedProgramsListProps {
  assignments: AssignmentWithProgram[];
  onRevoke: (id: string) => void | Promise<void>;
  emptyMessage: string;
}

/** Read-only list of program_assignments rows enriched with the program's
 * name/status — shared by the team roster page (team's assignments) and the
 * individual athlete modal (an athlete's direct + team-inherited assignments). */
export function AssignedProgramsList({
  assignments,
  onRevoke,
  emptyMessage,
}: AssignedProgramsListProps) {
  if (assignments.length === 0) {
    return <p className="text-portal-text3 text-xs">{emptyMessage}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {assignments.map((a) => (
        <li
          key={a.id}
          className="border-portal-border bg-portal-bg flex items-center gap-3 rounded-lg border px-3 py-2.5">
          <Link
            href={`/programs/${a.program_id}`}
            className="text-portal-text1 min-w-0 flex-1 truncate text-[13px] font-bold hover:underline">
            {a.programName}
          </Link>
          <ProgramStatusBadge status={a.programStatus} />
          <span className="text-portal-text3 flex-shrink-0 text-xs">
            Starts {formatStartDate(a.start_date)}
          </span>
          <InlineConfirmDelete
            idleTitle="Revoke assignment"
            idleClassName="text-portal-text3 hover:text-red-500"
            onDelete={() => onRevoke(a.id)}
          />
        </li>
      ))}
    </ul>
  );
}
