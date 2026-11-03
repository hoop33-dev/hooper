import { CardSkeleton, PageSkeleton } from "@/src/components/shell/Skeletons";

/** Mirrors `MembershipsPage`: a stack of membership cards. */
export default function MembershipsLoading() {
  return (
    <PageSkeleton title="Memberships" sub="Your packages. Stop any time">
      <div className="flex max-w-[880px] flex-col gap-3.5">
        <CardSkeleton rows={2} />
        <CardSkeleton rows={2} />
      </div>
    </PageSkeleton>
  );
}
