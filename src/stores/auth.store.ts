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

// checkVerification=true  → check email confirmation (hydrate/refreshProfile)
// checkVerification=false → skip verification check; caller already knows it's confirmed (signInComplete)
// session is used to read email_confirmed_at/confirmed_at before falling back to getUser()
async function fetchProfileAndRole(
  userId: string,
  checkVerification: boolean,
  session?: Session | null,
): Promise<{
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
    // Profile unreadable (RLS timing race or transient error). Don't route to
    // verification screen — the session IS valid. Route guard uses session metadata
    // for role until the profile becomes readable.
    return { profile: null, primaryRole: null, isVerified: true, hasRealEmail: true };
  }

  // verifyOtp and admin-created sessions include email_confirmed_at on the user
  // object. Persisted sessions also store this if it was present when setSession
  // was called. Trust it when available to avoid an extra getUser() network call.
  const sessionConfirmed = !!(
    session?.user?.email_confirmed_at ||
    (session?.user as unknown as { confirmed_at?: string })?.confirmed_at
  );

  const [{ data: roleData }, userResult] = await Promise.all([
    supabase
      .from("user_roles")
      .select("role")
      .eq("profile_id", profileData.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    // Skip getUser() when the session already tells us the email is confirmed,
    // or when the caller has already determined verification status.
    checkVerification && profileData.has_real_email && !sessionConfirmed
      ? supabase.auth.getUser()
      : null,
  ]);

  const isVerified =
    !checkVerification ||
    !profileData.has_real_email ||
    sessionConfirmed ||
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
    // Subscribe BEFORE getSession() to close the race window where a session
    // change fires between the two calls and would be silently missed.
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

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      set({ status: "unauthenticated", session: null, profile: null, primaryRole: null });
    } else {
      try {
        const { profile, primaryRole, isVerified, hasRealEmail } =
          await fetchProfileAndRole(session.user.id, true, session);

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
        await fetchProfileAndRole(session.user.id, true, session);

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
