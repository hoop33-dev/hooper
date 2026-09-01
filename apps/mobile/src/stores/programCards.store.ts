import { listAssignedPrograms } from "@/src/services/program.service";
import type { AthleteProgramCard } from "@hooper/api";
import { create, type StateCreator } from "zustand";

type ProgramCardsState = {
  cardsByProfile: Record<string, AthleteProgramCard[] | undefined>;
  fetchingProfileIds: Record<string, boolean>;

  /** Refreshes the cache for a profile. Cached data from a prior call stays
   * visible the whole time — this only ever adds/replaces an entry, never
   * clears one, so screens can render stale-then-fresh instead of flashing
   * a loading state on every remount (e.g. switching tabs and back). */
  load: (profileId: string) => Promise<void>;
};

const storeCreator: StateCreator<ProgramCardsState> = (set, get) => ({
  cardsByProfile: {},
  fetchingProfileIds: {},

  load: async (profileId: string) => {
    if (get().fetchingProfileIds[profileId]) return;
    set((s) => ({
      fetchingProfileIds: { ...s.fetchingProfileIds, [profileId]: true },
    }));
    try {
      const cards = await listAssignedPrograms(profileId);
      set((s) => ({
        cardsByProfile: { ...s.cardsByProfile, [profileId]: cards },
      }));
    } finally {
      set((s) => {
        const next = { ...s.fetchingProfileIds };
        delete next[profileId];
        return { fetchingProfileIds: next };
      });
    }
  },
});

export const useProgramCardsStore = create<ProgramCardsState>(storeCreator);
