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
  signInComplete: (session: Session, requiresVerification: boolean) => Promise<void>;
  setVerificationPending: (email: string) => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

// checkVerification=true  → call getUser() to check email_confirmed_at (hydrate/refreshProfile)
// checkVerification=false → skip getUser(); caller already knows verification status (signInComplete)
async function fetchProfileAndRole(userId: string, checkVerification: boolean): Promise<{
  profile: Profile | null;
  primaryRole: RoleType | null;
  isVerified: boolean;
  hasRealEmail: boolean;
}> {
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (!profileData) {
    return { profile: null, primaryRole: null, isVerified: false, hasRealEmail: true };
  }

  const [{ data: roleData }, userResult] = await Promise.all([
    supabase
      .from("user_roles")
      .select("role")
      .eq("profile_id", profileData.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    // Only call getUser() when we need to check email confirmation ourselves.
    // getUser() makes a server-side request and can fail silently after setSession
    // in some Supabase JS v2 versions, so we skip it when the edge function has
    // already given us a definitive answer via requiresVerification.
    checkVerification && profileData.has_real_email ? supabase.auth.getUser() : null,
  ]);

  const isVerified =
    !checkVerification || // caller already determined it's verified
    !profileData.has_real_email ||
    (userResult?.data?.user?.email_confirmed_at != null);

  return {
    profile: profileData as unknown as Profile,
    primaryRole: (roleData?.role ?? null) as RoleType | null,
    isVerified,
    hasRealEmail: profileData.has_real_email,
  };
}

// Module-level ref so hydrate() can unsubscribe a stale listener if called again.
let authSubscription: { unsubscribe: () => void } | null = null;

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
    } else {
      try {
        const { profile, primaryRole, isVerified, hasRealEmail } =
          await fetchProfileAndRole(session.user.id, true);

        const needsVerification = hasRealEmail && !isVerified;

        set({
          session,
          profile,
          primaryRole,
          status: needsVerification ? "needs_verification" : "authenticated",
        });
      } catch {
        set({ status: "unauthenticated", session: null, profile: null, primaryRole: null });
      }
    }

    authSubscription?.unsubscribe();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === "INITIAL_SESSION") return;

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

      set({ session: newSession });
    });

    authSubscription = subscription;
  },

  // requiresVerification comes directly from the edge function (admin-API-derived,
  // definitive). When false, we still fetch profile/role but skip the getUser() call
  // because we already know the email is confirmed. When true, we set state directly
  // without fetching the profile — it will be loaded by refreshProfile() after OTP.
  signInComplete: async (session: Session, requiresVerification: boolean) => {
    try {
      if (requiresVerification) {
        set({
          session,
          profile: null,
          primaryRole: null,
          status: "needs_verification",
          pendingVerificationEmail: session.user.email ?? null,
        });
        return;
      }

      const { profile, primaryRole } =
        await fetchProfileAndRole(session.user.id, false);

      set({
        session,
        profile,
        primaryRole,
        status: "authenticated",
        pendingVerificationEmail: null,
      });
    } catch {
      set({ status: "unauthenticated", session: null, profile: null, primaryRole: null });
      throw new Error("Unable to load your profile. Please try again.");
    }
  },

  setVerificationPending: (email: string) => {
    set({ status: "needs_verification", pendingVerificationEmail: email });
  },

  refreshProfile: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { profile, primaryRole, isVerified, hasRealEmail } =
        await fetchProfileAndRole(session.user.id, true);

      const needsVerification = hasRealEmail && !isVerified;

      set({
        session,
        profile,
        primaryRole,
        status: needsVerification ? "needs_verification" : "authenticated",
        pendingVerificationEmail: needsVerification ? get().pendingVerificationEmail : null,
      });
    } catch {
      // Network error — leave current status unchanged so the user can retry.
    }
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
