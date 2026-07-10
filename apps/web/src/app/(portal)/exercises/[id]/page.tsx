import { PortalBadge } from "@/src/components/portal/ui/PortalBadge";
import { getEmbedUrl } from "@/src/lib/videoEmbed";
import { getCoachProfile } from "@/src/services/auth.service";
import { getExerciseById } from "@/src/services/exercise.service";
import { listCategories } from "@/src/services/exerciseCategory.service";
import type { ExerciseWithDetails } from "@hooper/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteExerciseAction,
  updateExerciseAction,
  updateExerciseVideoUrlAction,
} from "../actions";
import { ExerciseDetailActions } from "./ExerciseDetailActions";

interface Props {
  params: Promise<{ id: string }>;
}

function ExerciseVideoLink({ url }: { url: string }) {
  const embedUrl = getEmbedUrl(url);
  if (embedUrl) {
    return (
      <iframe
        src={embedUrl}
        className="border-portal-border aspect-video w-full rounded-xl border"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-portal-orange text-sm font-semibold hover:underline">
      Watch video ↗
    </a>
  );
}

function ExerciseDetailBody({ exercise }: { exercise: ExerciseWithDetails }) {
  return (
    <div className="grid grid-cols-3 gap-8">
      <div className="col-span-2 flex flex-col gap-6">
        {exercise.description && (
          <div>
            <p className="text-portal-text3 mb-2 text-xs font-semibold tracking-widest uppercase">
              Description
            </p>
            <p className="text-portal-text2 text-sm leading-relaxed">
              {exercise.description}
            </p>
          </div>
        )}

        {exercise.categories.length > 0 && (
          <div>
            <p className="text-portal-text3 mb-2 text-xs font-semibold tracking-widest uppercase">
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
            <p className="text-portal-text3 mb-2 text-xs font-semibold tracking-widest uppercase">
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
          <p className="text-portal-text3 mb-1 text-xs font-semibold tracking-widest uppercase">
            Created
          </p>
          <p className="text-portal-text2 text-sm">
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
          <p className="text-portal-text3 mb-2 text-xs font-semibold tracking-widest uppercase">
            Demo video
          </p>
          {exercise.video_source === "link" ? (
            <ExerciseVideoLink url={exercise.video_url} />
          ) : (
            <video
              src={exercise.video_url}
              controls
              className="border-portal-border w-full rounded-xl border"
            />
          )}
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

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-portal-border bg-portal-card flex flex-shrink-0 items-center gap-2 border-b px-7 py-4">
        <Link
          href="/exercises"
          className="text-portal-text3 hover:text-portal-text2 text-sm">
          Exercise Library
        </Link>
        <span className="text-portal-text3">/</span>
        <span className="text-portal-text1 text-sm font-semibold">
          {exercise.name}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-8">
          <div className="mb-6 flex items-start justify-between">
            <h1 className="font-title text-portal-text1 text-3xl font-extrabold tracking-wide">
              {exercise.name}
            </h1>
            <ExerciseDetailActions
              exercise={exercise}
              categories={categories}
              profileId={profileId}
              updateAction={updateExerciseAction}
              deleteAction={deleteExerciseAction}
              updateVideoUrlAction={updateExerciseVideoUrlAction}
            />
          </div>

          <ExerciseDetailBody exercise={exercise} />
        </div>
      </div>
    </div>
  );
}
