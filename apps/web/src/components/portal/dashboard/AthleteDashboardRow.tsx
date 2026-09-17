import { ProgramBadge } from "@/src/components/portal/athletes/ProgramBadge";
import { AppLink } from "@/src/components/portal/ui/AppLink";
import type { AthleteDashboardRow as AthleteDashboardRowData } from "@hooper/db";

function formatLastLogin(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function AthleteDashboardRow({
  athlete,
}: {
  athlete: AthleteDashboardRowData;
}) {
  const name =
    [athlete.first_name, athlete.last_name].filter(Boolean).join(" ") ||
    athlete.username ||
    "Unnamed athlete";
  const initial = name.trim().charAt(0).toUpperCase() || "A";

  return (
    <AppLink
      href={`/athletes/${athlete.id}`}
      className="hover:bg-portal-bg flex items-center gap-3 px-5 py-3.5 transition-colors">
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
      <div className="min-w-0 flex-1">
        <div className="text-portal-text1 truncate text-[13px] font-bold">
          {name}
        </div>
        <div className="text-portal-text3 mt-0.5 truncate text-xs">
          {athlete.regionName ?? "—"}
        </div>
      </div>
      <ProgramBadge programs={athlete.programs} />
      <div className="text-portal-text3 w-16 flex-shrink-0 text-right text-xs">
        {formatLastLogin(athlete.last_sign_in_at)}
      </div>
    </AppLink>
  );
}
