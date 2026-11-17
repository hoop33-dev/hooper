import { CardSkeleton, PageSkeleton } from "@/src/components/shell/Skeletons";

/** The page itself is static, but without this the household skeleton from
 * `children/loading.tsx` would flash on the way in. */
export default function AddChildLoading() {
  return (
    <PageSkeleton
      title="Add a child"
      sub="They get their own login for the Hooper app. You stay in charge of billing."
      back={{ href: "/children", label: "Children" }}>
      <div className="max-w-[640px]">
        <CardSkeleton rows={4} />
      </div>
    </PageSkeleton>
  );
}
