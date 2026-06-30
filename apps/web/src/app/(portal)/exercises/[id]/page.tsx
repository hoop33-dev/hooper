import { notFound } from "next/navigation";
import Link from "next/link";
import { getExerciseById } from "@/src/services/exercise.service";
import { listCategories } from "@/src/services/exerciseCategory.service";
import { getCoachProfile } from "@/src/services/auth.service";
import { PortalBadge } from "@/src/components/portal/ui/PortalBadge";
import { ExerciseDetailActions } from "./ExerciseDetailActions";
import {
  updateExerciseAction,
  deleteExerciseAction,
} from "../actions";
import { uploadExerciseVideo } from "@/src/services/exercise.service";
import type { ExerciseWithDetails } from "@hooper/db";

interface Props {
  params: Promise<{ id: string }>;
}

function ExerciseDetailBody({ exercise }: { exercise: ExerciseWithDetails }) {
  return (
    <div className="grid grid-cols-3 gap-8">
      <div className="col-span-2 flex flex-col gap-6">
        {exercise.description && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-portal-text3">
              Description
            </p>
            <p className="text-sm leading-relaxed text-portal-text2">
              {exercise.description}
            </p>
          </div>
        )}

        {exercise.categories.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-portal-text3">
              Categories
            </p>
            <div className="flex flex-wrap gap-2">
              {exercise.categories.map((cat) => (
                <PortalBadge key={cat.id} variant="neutral">
                  {cat.name}
                </PortalBadge>
              ))}
            </div>
          </div>
        )}

        {exercise.unitTypes.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-portal-text3">
              Default unit types
            </p>
            <div className="flex flex-wrap gap-2">
              {exercise.unitTypes.map((u) => (
                <PortalBadge key={u} variant="orange">
                  {u}
                </PortalBadge>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-portal-text3">
            Created
          </p>
          <p className="text-sm text-portal-text2">
            {new Date(exercise.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {exercise.video_url && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-portal-text3">
            Demo video
          </p>
          <video
            src={exercise.video_url}
            controls
            className="w-full rounded-xl border border-portal-border"
          />
        </div>
      )}
    </div>
  );
}

export default async function ExerciseDetailPage({ params }: Props) {
  const { id } = await params;
  const [exerciseResult, categoriesResult, profileResult] = await Promise.all([
    getExerciseById(id),
    listCategories(),
    getCoachProfile(),
  ]);

  if (!exerciseResult.ok) notFound();

  const exercise = exerciseResult.data;
  const categories = categoriesResult.ok ? categoriesResult.data : [];
  const profileId = profileResult.ok ? profileResult.data.id : "";

  async function uploadVideoAction(exerciseId: string, file: File, pid: string) {
    "use server";
    const result = await uploadExerciseVideo(exerciseId, file, pid);
    return result.ok ? { ok: true } : { ok: false, error: result.error };
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-portal-border bg-portal-card px-7 py-4">
        <Link href="/exercises" className="text-sm text-portal-text3 hover:text-portal-text2">
          Exercise Library
        </Link>
        <span className="text-portal-text3">/</span>
        <span className="text-sm font-semibold text-portal-text1">{exercise.name}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-8">
          <div className="mb-6 flex items-start justify-between">
            <h1 className="font-title text-3xl font-extrabold tracking-wide text-portal-text1">
              {exercise.name}
            </h1>
            <ExerciseDetailActions
              exercise={exercise}
              categories={categories}
              profileId={profileId}
              updateAction={updateExerciseAction}
              deleteAction={deleteExerciseAction}
              uploadVideoAction={uploadVideoAction}
            />
          </div>

          <ExerciseDetailBody exercise={exercise} />
        </div>
      </div>
    </div>
  );
}
