import { useEffect, useState } from "react";

import {
  listRegionOptions,
  type RegionOption,
} from "@/src/services/region.service";

/** Loads region options (UUID value + display label) for select inputs. */
export function useRegionOptions(): RegionOption[] {
  const [options, setOptions] = useState<RegionOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const opts = await listRegionOptions();
      if (!cancelled) setOptions(opts);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return options;
}
