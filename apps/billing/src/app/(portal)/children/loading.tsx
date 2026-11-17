import { PlusIcon } from "@/src/components/icons";
import { CardSkeleton, PageSkeleton } from "@/src/components/shell/Skeletons";
import { Btn } from "@/src/components/ui/Btn";

/** Mirrors `HouseholdPage`: roster on the left, charges + add-child on the
 * right. */
export default function HouseholdLoading() {
  return (
    <PageSkeleton
      title="Household"
      sub="One account, a package per child"
      right={
        <Btn variant="primary" size="sm" disabled>
          <PlusIcon size={14} /> Add child
        </Btn>
      }>
      <div className="grid grid-cols-1 items-start gap-[18px] lg:grid-cols-[1.6fr_1fr]">
        <CardSkeleton rows={3} avatars />
        <div className="flex min-w-0 flex-col gap-3.5">
          <CardSkeleton rows={2} />
          <CardSkeleton rows={1} />
        </div>
      </div>
    </PageSkeleton>
  );
}
