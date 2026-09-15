import { ExerciseLibrarySkeleton } from "@/src/components/portal/exercises/ExerciseLibrarySkeleton";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";

export default function ExercisesLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Exercise Library"
        subtitle="Create and manage exercises for your training programs"
      />
      <ExerciseLibrarySkeleton />
    </div>
  );
}
