"use client";

import type { AssignmentWithProgram } from "@hooper/db";
import Link from "next/link";
import { InlineConfirmDelete } from "../ui/InlineConfirmDelete";
import { ChevronRightIcon } from "../ui/icons";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

interface AssignedProgramsListProps {
  assignments: AssignmentWithProgram[];
  onRevoke: (id: string) => void | Promise<void>;
  emptyMessage: string;
}

/** Table of program_assignments rows enriched with the program's name —
 * shared by the team roster page (team's assignments) and the individual
 * athlete modal (an athlete's direct + team-inherited assignments). */
export function AssignedProgramsList({
  assignments,
  onRevoke,
  emptyMessage,
}: AssignedProgramsListProps) {
  if (assignments.length === 0) {
    return <p className="text-portal-text3 text-xs">{emptyMessage}</p>;
  }

  const columns = ["Program", "Added", "Starts"];

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-portal-border border-b">
          {columns.map((h) => (
            <th
              key={h}
              className="text-portal-text3 pt-4 pr-4 pb-3 text-left text-[11px] font-semibold tracking-widest uppercase">
              {h}
            </th>
          ))}
          <th className="w-20" />
        </tr>
      </thead>
      <tbody>
        {assignments.map((a, i) => (
          <tr
            key={a.id}
            className={`border-portal-border ${i !== assignments.length - 1 ? "border-b" : ""}`}>
            <td className="py-3.5 pr-4">
              <div className="text-portal-text1 text-[13px] font-bold">
                {a.programName}
              </div>
            </td>
            <td className="text-portal-text3 py-3.5 pr-4 text-xs">
              {formatDate(a.created_at)}
            </td>
            <td className="text-portal-text2 py-3.5 pr-4 text-[13px]">
              {formatDate(a.start_date)}
            </td>
            <td className="py-3.5 text-right">
              <div className="flex items-center justify-end gap-2">
                <Link
                  href={`/programs/${a.program_id}`}
                  title="Go to program"
                  className="text-portal-text3 hover:text-portal-orange flex h-6 w-6 flex-shrink-0 items-center justify-center rounded">
                  <ChevronRightIcon />
                </Link>
                <InlineConfirmDelete
                  idleTitle="Revoke assignment"
                  idleClassName="text-portal-text3 hover:text-red-500"
                  onDelete={() => onRevoke(a.id)}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
