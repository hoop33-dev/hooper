import { StyleManagerShell } from "@/src/components/portal/exercises/StyleManagerShell";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { getCoachProfile } from "@/src/services/auth.service";
import { listExercises } from "@/src/services/exercise.service";
import { listStyles } from "@/src/services/exerciseStyle.service";
import Link from "next/link";
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
