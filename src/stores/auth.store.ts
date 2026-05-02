import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";
import { signOut as authSignOut } from "@/src/services/auth.service";
import type { Profile, RoleType } from "@/src/types/database.types";

type AuthStatus =
  | "loading"
  | "unauthenticated"
  | "needs_verification"
  | "authenticated";

type AuthState = {
  status: AuthStatus;
  session: Session | null;
  profile: Profile | null;
  primaryRole: RoleType | null;
  pendingVerificationEmail: string | null;

  hydrate: () => Promise<void>;
  setVerificationPending: (email: string) => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

async function fetchProfileAndRole(userId: string): Promise<{
  profile: Profile | null;
  primaryRole: RoleType | null;
  isVerified: boolean;
  hasRealEmail: boolean;
}> {
  const { data: profileData } = await supabase
    .from("profile_with_verification")
    .select("*")
    .eq("auth_user_id", userId)
    .single();

  if (!profileData) {
    return { profile: null, primaryRole: null, isVerified: false, hasRealEmail: true };
  }

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("profile_id", profileData.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  return {
    profile: profileData as unknown as Profile,
    primaryRole: (roleData?.role ?? null) as RoleType | null,
    isVerified: profileData.is_verified as boolean,
    hasRealEmail: profileData.has_real_email as boolean,
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "loading",
  session: null,
  profile: null,
  primaryRole: null,
  pendingVerificationEmail: null,

  hydrate: async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      set({ status: "unauthenticated", session: null, profile: null, primaryRole: null });
      return;
    }

    const { profile, primaryRole, isVerified, hasRealEmail } =
      await fetchProfileAndRole(session.user.id);

    const needsVerification = hasRealEmail && !isVerified;

    set({
      session,
      profile,
      primaryRole,
      status: needsVerification ? "needs_verification" : "authenticated",
    });

    // Subscribe to auth state changes (idempotent — only update session, don't re-fetch profile on token refresh)
    supabase.auth.onAuthStateChange((event, newSession) => {
      const current = get();

      if (!newSession) {
        set({
          status: "unauthenticated",
          session: null,
          profile: null,
          primaryRole: null,
          pendingVerificationEmail: null,
        });
        return;
      }

      // On token refresh the user id hasn't changed — just update session quietly
      if (
        event === "TOKEN_REFRESHED" &&
        current.profile?.auth_user_id === newSession.user.id
      ) {
        set({ session: newSession });
        return;
      }

      // On sign-in or user-updated events, re-fetch profile only if user id changed or profile is absent
      if (
        current.profile?.auth_user_id !== newSession.user.id ||
        !current.profile
      ) {
        fetchProfileAndRole(newSession.user.id).then(
          ({ profile: p, primaryRole: r, isVerified: v, hasRealEmail: h }) => {
            const needs = h && !v;
            set({
              session: newSession,
              profile: p,
              primaryRole: r,
              status: needs ? "needs_verification" : "authenticated",
            });
          },
        );
      }
    });
  },

  setVerificationPending: (email: string) => {
    set({ status: "needs_verification", pendingVerificationEmail: email });
  },

  refreshProfile: async () => {
    const { session } = get();
    if (!session) return;

    const { profile, primaryRole, isVerified, hasRealEmail } =
      await fetchProfileAndRole(session.user.id);

    const needsVerification = hasRealEmail && !isVerified;

    set({
      profile,
      primaryRole,
      status: needsVerification ? "needs_verification" : "authenticated",
      pendingVerificationEmail: needsVerification ? get().pendingVerificationEmail : null,
    });
  },

  signOut: async () => {
    await authSignOut();
    set({
      status: "unauthenticated",
      session: null,
      profile: null,
      primaryRole: null,
      pendingVerificationEmail: null,
    });
  },
}));
