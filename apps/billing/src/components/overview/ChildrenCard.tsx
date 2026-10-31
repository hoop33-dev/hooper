import { ChevronIcon } from "@/src/components/icons";
import { Avatar, Card, Label, Tag } from "@/src/components/ui/primitives";
import { fullName, initials } from "@/src/lib/format";
import { isLive } from "@/src/lib/household";
import type { MyChild, MyPackagePurchase } from "@hooper/db";
import { AppLink } from "@hooper/shared/next";

const TONES = ["orange", "navy", "slate", "blue"] as const;

/** Design OverviewB "Children": each child with their membership count and
 * a Fix flag when a renewal failed. */
export function ChildrenCard({
  childList,
  purchases,
}: {
  childList: MyChild[];
  purchases: MyPackagePurchase[];
}) {
  return (
    <Card>
      <Label className="mb-3">Children</Label>
      <ul className="flex flex-col gap-1">
        {childList.map((c, i) => {
          const theirs = purchases.filter(
            (p) => p.athlete_profile_id === c.profile_id,
          );
          const live = theirs.filter((p) => isLive(p)).length;
          const fix = theirs.some((p) => p.status === "past_due");
          return (
            <li key={c.profile_id}>
              <AppLink
                href={`/children/${c.profile_id}`}
                className="hover:bg-bp-bg/60 -mx-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5">
                <Avatar
                  initials={initials(c.first_name, c.last_name)}
                  size={30}
                  tone={TONES[i % TONES.length]}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-bp-text1 truncate text-[13px] font-semibold">
                    {c.first_name ||
                      fullName(c.first_name, c.last_name) ||
                      c.username}
                  </div>
                  <div className="text-bp-text3 text-[11.5px]">
                    {live} membership{live === 1 ? "" : "s"}
                  </div>
                </div>
                {fix && <Tag tone="danger">Fix</Tag>}
                <ChevronIcon size={15} className="text-bp-text3 shrink-0" />
              </AppLink>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
