import { AthletesListShell } from "@/src/components/portal/athletes/AthletesListShell";
import { AthletesTabs } from "@/src/components/portal/athletes/AthletesTabs";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { listAthletes } from "@/src/services/athlete.service";

export default async function AthletesPage() {
  const athletesResult = await listAthletes();
  const athletes = athletesResult.ok ? athletesResult.data : [];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Athletes"
        subtitle="Browse athletes and manage their program assignments"
        action={<AthletesTabs />}
      />
      {!athletesResult.ok && (
        <div className="border-b border-red-200 bg-red-50 px-7 py-2 text-xs text-red-600">
          Couldn&apos;t load athletes: {athletesResult.error}
        </div>
      )}
      <AthletesListShell athletes={athletes} />
    </div>
  );
}
