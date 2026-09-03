import { UnitTypeManagerShell } from "@/src/components/portal/exercises/UnitTypeManagerShell";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { getCoachProfile } from "@/src/services/auth.service";
import { listExercises } from "@/src/services/exercise.service";
import { listUnitTypes } from "@/src/services/unitType.service";
import {
  createUnitTypeAction,
  deleteUnitTypeAction,
  updateUnitTypeAction,
} from "./actions";

export default async function UnitTypesPage() {
  const [unitTypesResult, exercisesResult, profileResult] = await Promise.all([
    listUnitTypes(),
    listExercises(),
    getCoachProfile(),
  ]);

  const unitTypes = unitTypesResult.ok ? unitTypesResult.data : [];
  const exercises = exercisesResult.ok ? exercisesResult.data : [];
  const profileId = profileResult.ok ? profileResult.data.id : "";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Exercise Library"
        subtitle="Manage the unit types available when configuring an exercise's defaults"
        backHref="/exercises"
        breadcrumbs={[
          { label: "Exercises", href: "/exercises" },
          { label: "Unit types" },
        ]}
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
