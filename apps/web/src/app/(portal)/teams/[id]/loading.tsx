import { DetailPageSkeleton } from "@/src/components/portal/ui/DetailPageSkeleton";

/** Mirrors `TeamDetailShell`: athletes and programs side by side. */
export default function TeamDetailLoading() {
  return (
    <DetailPageSkeleton gridClassName="lg:grid-cols-2" columns={[[4], [2]]} />
  );
}
