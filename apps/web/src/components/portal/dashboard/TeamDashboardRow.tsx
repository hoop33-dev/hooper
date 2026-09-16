import { ProgramBadge } from "@/src/components/portal/athletes/ProgramBadge";
import { AppLink } from "@/src/components/portal/ui/AppLink";
import { UsersIcon } from "@/src/components/portal/ui/icons";
import type { TeamDashboardRow as TeamDashboardRowData } from "@hooper/db";

export function TeamDashboardRow({ team }: { team: TeamDashboardRowData }) {
  const initial = team.name.trim().charAt(0).toUpperCase() || "T";
  return (
    <AppLink
      href={`/teams/${team.id}`}
      className="hover:bg-portal-bg flex items-center gap-3 px-5 py-3.5 transition-colors">
      <div className="bg-portal-orange-soft text-portal-orange flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-extrabold">
        {team.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={team.avatar_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          initial
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-portal-text1 truncate text-[13px] font-bold">
          {team.name}
        </div>
        <div className="text-portal-text3 mt-0.5 flex items-center gap-1 text-xs">
          <UsersIcon size={11} />
          {team.memberCount}
        </div>
      </div>
      <ProgramBadge programs={team.programs} />
    </AppLink>
  );
}
