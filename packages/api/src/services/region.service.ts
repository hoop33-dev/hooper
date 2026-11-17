import { getClient } from "../client";

export type RegionOption = {
  /** UUID matching profiles.region_id */
  value: string;
  /** Display name */
  label: string;
};

export async function listRegionOptions(): Promise<RegionOption[]> {
  const { data, error } = await getClient()
    .from("regions")
    .select("id, name")
    .order("name");

  if (error || !data) return [];

  return data.map((r) => ({ value: r.id, label: r.name }));
}
