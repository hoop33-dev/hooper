import { UnitTypeManagerShell } from "@/src/components/portal/exercises/UnitTypeManagerShell";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { getCoachProfile } from "@/src/services/auth.service";
import { listExercises } from "@/src/services/exercise.service";
import { listUnitTypes } from "@/src/services/unitType.service";
import Link from "next/link";
import {
  createUnitTypeAction,
  deleteUnitTypeAction,
  updateUnitTypeAction,
} from "./actions";

export default async function UnitTypesPage() {
  const [unitTypesResult, exercisesResult, profileResult] = await Promise.all(
    [listUnitTypes(), listExercises(), getCoachProfile()],
  );

  const unitTypes = unitTypesResult.ok ? unitTypesResult.data : [];
  const exercises = exercisesResult.ok ? exercisesResult.data : [];
  const profileId = profileResult.ok ? profileResult.data.id : "";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Exercise Library"
        subtitle="Manage the unit types available when configuring an exercise's defaults"
        action={
          <Link
            href="/exercises"
            className="border-portal-border bg-portal-card text-portal-text1 hover:bg-portal-border/50 inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-sm font-semibold transition">
            <svg
              className="text-portal-text2 h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to exercises
          </Link>
        }
      />
      <UnitTypeManagerShell
        initialUnitTypes={unitTypes}
        exercises={exercises}
        createAction={createUnitTypeAction}
        updateAction={updateUnitTypeAction}
        deleteAction={deleteUnitTypeAction}
        profileId={profileId}
      />
    </div>
  );
}
