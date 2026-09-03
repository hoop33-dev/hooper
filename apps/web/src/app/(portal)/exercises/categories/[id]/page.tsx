import { CategoryManagerShell } from "@/src/components/portal/exercises/CategoryManagerShell";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import { getCoachProfile } from "@/src/services/auth.service";
import { listExercises } from "@/src/services/exercise.service";
import {
  getCategoryById,
  listCategories,
} from "@/src/services/exerciseCategory.service";
import { notFound } from "next/navigation";
import {
  createCategoryAction,
  deleteCategoryAction,
  reorderCategoriesAction,
  updateCategoryAction,
} from "../actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CategoryDetailPage({ params }: Props) {
  const { id } = await params;
  const [categoryResult, categoriesResult, exercisesResult, profileResult] =
    await Promise.all([
      getCategoryById(id),
      listCategories(),
      listExercises(),
      getCoachProfile(),
    ]);

  if (!categoryResult.ok) notFound();

  const categories = categoriesResult.ok ? categoriesResult.data : [];
  const exercises = exercisesResult.ok ? exercisesResult.data : [];
  const profileId = profileResult.ok ? profileResult.data.id : "";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Exercise Library"
        subtitle="Manage categories to organise your exercises"
        backHref="/exercises/categories"
        breadcrumbs={[
          { label: "Exercises", href: "/exercises" },
          { label: "Categories", href: "/exercises/categories" },
          { label: categoryResult.data.name },
        ]}
      />
      <CategoryManagerShell
        initialCategories={categories}
        exercises={exercises}
        initialSelectedId={id}
        createAction={createCategoryAction}
        updateAction={updateCategoryAction}
        deleteAction={deleteCategoryAction}
        reorderAction={reorderCategoriesAction}
        profileId={profileId}
      />
    </div>
  );
}
