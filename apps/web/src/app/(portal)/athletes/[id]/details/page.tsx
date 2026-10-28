import { AthleteDetailsTab } from "@/src/components/portal/athletes/AthleteDetailsTab";
import { listRegions } from "@/src/services/region.service";

/** The Details tab. The athlete and account come from the layout (via
 * context), as does saving; only the location picker's regions are loaded here. */
export default async function AthleteDetailsPage() {
  const regionsResult = await listRegions();
  return (
    <AthleteDetailsTab regions={regionsResult.ok ? regionsResult.data : []} />
  );
}
