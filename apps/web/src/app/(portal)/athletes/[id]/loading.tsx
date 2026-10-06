import { DetailPageSkeleton } from "@/src/components/portal/ui/DetailPageSkeleton";

/** Mirrors `AthleteDetailShell`: profile + teams on the left, programs on
 * the right. */
export default function AthleteDetailLoading() {
  return (
    <DetailPageSkeleton
      action={false}
      gridClassName="lg:grid-cols-[300px_minmax(0,1fr)]"
      columns={[[3, 1], [3]]}
    />
  );
}
