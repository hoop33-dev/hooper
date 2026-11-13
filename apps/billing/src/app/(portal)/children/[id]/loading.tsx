import { PageBody } from "@/src/components/shell/Shell";
import {
  CardSkeleton,
  DetailHeaderSkeleton,
  Pulse,
} from "@/src/components/shell/Skeletons";

/** Mirrors `ChildPage`. Without this the household list skeleton would show
 * for a child's page. */
export default function ChildLoading() {
  return (
    <>
      <DetailHeaderSkeleton back={{ href: "/children", label: "Children" }} />
      <div className="border-bp-border bg-bp-card flex shrink-0 gap-1.5 border-b px-4 py-3 md:px-7 md:py-3.5">
        <Pulse className="h-[31px] w-[72px] rounded-full" />
        <Pulse className="bg-bp-border/40 h-[31px] w-[68px] rounded-full" />
      </div>
      <PageBody>
        <div className="flex max-w-[720px] flex-col gap-4">
          <CardSkeleton rows={2} />
          <CardSkeleton rows={2} />
        </div>
      </PageBody>
    </>
  );
}
