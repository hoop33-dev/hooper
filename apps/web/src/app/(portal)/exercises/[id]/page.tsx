import { ExercisesPageContent } from "../ExercisesPageContent";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ExerciseDetailPage({ params }: Props) {
  const { id } = await params;
  return <ExercisesPageContent editExerciseId={id} />;
}
