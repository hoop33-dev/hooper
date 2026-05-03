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
  signInComplete: (session: Session) => Promise<void>;
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
    .from("profiles")
    .select("*")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (!profileData) {
    return { profile: null, primaryRole: null, isVerified: false, hasRealEmail: true };
  }

  // Fetch role and email confirmation in parallel.
  // getUser() makes a server call — email_confirmed_at is NOT in the JWT payload
  // so session.user.email_confirmed_at is always null and cannot be used.
  const [{ data: roleData }, userResult] = await Promise.all([
    supabase
      .from("user_roles")
      .select("role")
      .eq("profile_id", profileData.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    profileData.has_real_email ? supabase.auth.getUser() : null,
  ]);

  // A child account (has_real_email = false) is always considered verified.
  const isVerified =
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
          await fetchProfileAndRole(session.user.id);

        const needsVerification = hasRealEmail && !isVerified;

        set({
          session,
          profile,
          primaryRole,
          status: needsVerification ? "needs_verification" : "authenticated",
        });
      } catch {
        // Profile fetch failed on app start — clear session so the user can sign in again.
        set({ status: "unauthenticated", session: null, profile: null, primaryRole: null });
      }
    }

    // Unsubscribe any previous listener before registering a new one, so calling
    // hydrate() more than once doesn't stack up duplicate subscriptions.
    authSubscription?.unsubscribe();

    // onAuthStateChange only handles session updates and sign-out — no async profile
    // fetching, which avoids concurrent-fetch update loops.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      // INITIAL_SESSION is already handled synchronously above via getSession().
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

      // For any auth event that carries a session (TOKEN_REFRESHED, USER_UPDATED,
      // SIGNED_IN from setSession), just keep the stored session fresh.
      set({ session: newSession });
    });

    authSubscription = subscription;
  },

  // Called by the login screen after signInWithUsername succeeds. Fetches profile
  // and sets the appropriate status so the route guard can navigate.
  signInComplete: async (session: Session) => {
    try {
      const { profile, primaryRole, isVerified, hasRealEmail } =
        await fetchProfileAndRole(session.user.id);

      const needsVerification = hasRealEmail && !isVerified;

      set({
        session,
        profile,
        primaryRole,
        status: needsVerification ? "needs_verification" : "authenticated",
        pendingVerificationEmail: needsVerification ? (session.user.email ?? null) : null,
      });
    } catch {
      set({ status: "unauthenticated", session: null, profile: null, primaryRole: null });
      throw new Error("Unable to load your profile. Please try again.");
    }
  },

  setVerificationPending: (email: string) => {
    set({ status: "needs_verification", pendingVerificationEmail: email });
  },

  // Uses a fresh session from the Supabase client so changes like email confirmation
  // are reflected. Safe to call getSession() here because onAuthStateChange no longer
  // does async work that could loop back through here.
  refreshProfile: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { profile, primaryRole, isVerified, hasRealEmail } =
        await fetchProfileAndRole(session.user.id);

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
