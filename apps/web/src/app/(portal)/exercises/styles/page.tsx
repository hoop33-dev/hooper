import { StyleManagerShell } from "@/src/components/portal/exercises/StyleManagerShell";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { getCoachProfile } from "@/src/services/auth.service";
import { listExercises } from "@/src/services/exercise.service";
import { listStyles } from "@/src/services/exerciseStyle.service";
import {
  createStyleAction,
  deleteStyleAction,
  updateStyleAction,
} from "./actions";

export default async function StylesPage() {
  const [stylesResult, exercisesResult, profileResult] = await Promise.all([
    listStyles(),
    listExercises(),
    getCoachProfile(),
  ]);

  const styles = stylesResult.ok ? stylesResult.data : [];
  const exercises = exercisesResult.ok ? exercisesResult.data : [];
  const profileId = profileResult.ok ? profileResult.data.id : "";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Exercise Library"
        subtitle="Manage styles that describe how to interpret an exercise's unit types"
        backHref="/exercises"
        breadcrumbs={[
          { label: "Exercises", href: "/exercises" },
          { label: "Styles" },
        ]}
      />
      <StyleManagerShell
        initialStyles={styles}
        exercises={exercises}
        createAction={createStyleAction}
        updateAction={updateStyleAction}
        deleteAction={deleteStyleAction}
        profileId={profileId}
      />
    </div>
  );
}
