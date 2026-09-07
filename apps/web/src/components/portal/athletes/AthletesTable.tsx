"use client";

import { AppLink } from "@/src/components/portal/ui/AppLink";
import type { AthleteSummary } from "@hooper/db";
import { ProgramBadge } from "./ProgramBadge";

function formatLastLogin(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function AthleteNameCell({ athlete }: { athlete: AthleteSummary }) {
  const name =
    [athlete.first_name, athlete.last_name].filter(Boolean).join(" ") ||
    athlete.username ||
    "Unnamed athlete";
  const initial = name.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="flex items-center gap-3">
      <div className="bg-portal-orange-soft text-portal-orange flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-extrabold">
        {athlete.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={athlete.avatar_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          initial
        )}
      </div>
      <div>
        <div className="text-portal-text1 text-[13px] font-bold">{name}</div>
        {athlete.username && (
          <div className="text-portal-text3 mt-0.5 text-xs">
            @{athlete.username}
          </div>
        )}
      </div>
    </div>
  );
}

interface AthletesTableProps {
  athletes: AthleteSummary[];
}

export function AthletesTable({ athletes }: AthletesTableProps) {
  const columns = ["Athlete", "Program", "Last login"];

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
        </tr>
      </thead>
      <tbody>
        {athletes.map((athlete) => (
          <tr
            key={athlete.id}
            className="border-portal-border hover:bg-portal-bg relative cursor-pointer border-b">
            <td className="py-3.5 pr-4">
              <AppLink
                href={`/athletes/${athlete.id}`}
                className="after:absolute after:inset-0 after:z-0">
                <AthleteNameCell athlete={athlete} />
              </AppLink>
            </td>
            <td className="py-3.5 pr-4">
              <ProgramBadge programs={athlete.programs} />
            </td>
            <td className="text-portal-text3 py-3.5 pr-4 text-xs">
              {formatLastLogin(athlete.last_sign_in_at)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
