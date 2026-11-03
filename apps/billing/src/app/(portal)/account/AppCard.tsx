import { AppQr, StoreBadges } from "@/src/components/app/AppLinks";
import { Card, Label } from "@/src/components/ui/primitives";

export function AppCard() {
  return (
    <Card>
      <Label className="mb-2.5">The Hooper app</Label>
      <div className="mb-3.5 flex items-center gap-3.5">
        <AppQr size={78} />
        <div className="text-bp-text2 text-[12.5px] leading-normal">
          Scan to open Hooper on your phone. Same login.
        </div>
      </div>
      <StoreBadges dark={false} />
    </Card>
  );
}
