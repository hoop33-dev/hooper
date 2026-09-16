import { AppLink } from "@/src/components/portal/ui/AppLink";
import { UsersIcon } from "@/src/components/portal/ui/icons";
import type { ProgramDashboardRow as ProgramDashboardRowData } from "@hooper/db";

export function ProgramDashboardRow({
  program,
}: {
  program: ProgramDashboardRowData;
}) {
  const initial = program.name.trim().charAt(0).toUpperCase() || "P";
  return (
    <AppLink
      href={`/programs/${program.id}`}
      className="hover:bg-portal-bg flex items-center gap-3 px-5 py-3.5 transition-colors">
      <div className="bg-portal-orange-soft text-portal-orange flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-extrabold">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-portal-text1 truncate text-[13px] font-bold">
          {program.name}
        </div>
        <div className="text-portal-text3 mt-0.5 text-xs">
          {program.weeks} {program.weeks === 1 ? "week" : "weeks"}
        </div>
      </div>
      <div className="text-portal-text2 flex items-center gap-1 text-xs">
        <UsersIcon size={12} />
        {program.accessCount}
      </div>
    </AppLink>
  );
}
