import { AthletesListShell } from "@/src/components/portal/athletes/AthletesListShell";
import { listAthletes } from "@/src/services/athlete.service";

export default async function AthletesPage() {
  const athletesResult = await listAthletes();
  const athletes = athletesResult.ok ? athletesResult.data : [];

  return (
    <>
      {!athletesResult.ok && (
        <div className="border-b border-red-200 bg-red-50 px-7 py-2 text-xs text-red-600">
          Couldn&apos;t load athletes: {athletesResult.error}
        </div>
      )}
      <AthletesListShell athletes={athletes} />
    </>
  );
}
