import { notFound } from "next/navigation";
import { listCategories, getCategoryById } from "@/src/services/exerciseCategory.service";
import { listExercises } from "@/src/services/exercise.service";
import { getCoachProfile } from "@/src/services/auth.service";
import { CategoryManagerShell } from "@/src/components/portal/exercises/CategoryManagerShell";
import { PageHeader } from "@/src/components/portal/ui/PageHeader";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  reorderCategoriesAction,
} from "../actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CategoryDetailPage({ params }: Props) {
  const { id } = await params;
  const [categoryResult, categoriesResult, exercisesResult, profileResult] = await Promise.all([
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
