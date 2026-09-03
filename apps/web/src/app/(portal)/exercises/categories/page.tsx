import { CategoryManagerShell } from "@/src/components/portal/exercises/CategoryManagerShell";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { getCoachProfile } from "@/src/services/auth.service";
import { listExercises } from "@/src/services/exercise.service";
import { listCategories } from "@/src/services/exerciseCategory.service";
import {
  createCategoryAction,
  deleteCategoryAction,
  reorderCategoriesAction,
  updateCategoryAction,
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
        backHref="/exercises"
        breadcrumbs={[
          { label: "Exercises", href: "/exercises" },
          { label: "Categories" },
        ]}
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
