import Link from "next/link";
import { listCategories } from "@/src/services/exerciseCategory.service";
import { listExercises } from "@/src/services/exercise.service";
import { getCoachProfile } from "@/src/services/auth.service";
import { CategoryManagerShell } from "@/src/components/portal/exercises/CategoryManagerShell";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  reorderCategoriesAction,
} from "./actions";

export default async function CategoriesPage() {
  const [categoriesResult, exercisesResult, profileResult] = await Promise.all([
    listCategories(),
    listExercises(),
    getCoachProfile(),
  ]);

  const categories = categoriesResult.ok ? categoriesResult.data : [];
  const exercises = exercisesResult.ok ? exercisesResult.data : [];
  const profileId = profileResult.ok ? profileResult.data.id : "";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Exercise Library"
        subtitle="Manage categories to organise your exercises"
        action={
          <Link
            href="/exercises"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-portal-border bg-portal-card px-4 text-sm font-semibold text-portal-text1 hover:bg-portal-border/50 transition"
          >
            <svg className="h-3.5 w-3.5 text-portal-text2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to exercises
          </Link>
        }
      />
      <CategoryManagerShell
        initialCategories={categories}
        exercises={exercises}
        createAction={createCategoryAction}
        updateAction={updateCategoryAction}
        deleteAction={deleteCategoryAction}
        reorderAction={reorderCategoriesAction}
        profileId={profileId}
      />
    </div>
  );
}
