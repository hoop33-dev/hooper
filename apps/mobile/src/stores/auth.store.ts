import type { RoleId } from "@/src/constants/roles";
import { supabase } from "@/src/lib/supabase";
import { signOut as authSignOut } from "@/src/services/auth.service";
import type { Profile, RoleType } from "@/src/types/database.types";
import type { Session } from "@supabase/supabase-js";
import { create, type StateCreator } from "zustand";

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
  pendingVerificationRole: RoleId | null;

  hydrate: () => Promise<void>;
  signInComplete: (session: Session) => Promise<void>;
  setVerificationPending: (email: string, role?: RoleId) => void;
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

  // verifyOtp and admin-created sessions include email_confirmed_at on the user
  // object. Persisted sessions also store this if it was present when setSession
  // was called. Trust it when available to avoid an extra getUser() network call.
  const sessionConfirmed = !!(
    session?.user?.email_confirmed_at ||
    (session?.user as unknown as { confirmed_at?: string })?.confirmed_at
  );

  if (!profileData) {
    // Profile unreadable (RLS timing race, trigger lag, or transient error).
    // We can't confirm has_real_email, so verify against the auth user before
    // letting an unconfirmed signup through to the app.
    let isVerified = !checkVerification || sessionConfirmed;
    if (checkVerification && !sessionConfirmed) {
      const { data: userData } = await supabase.auth.getUser();
      isVerified = userData?.user?.email_confirmed_at != null;
    }
    return {
      profile: null,
      primaryRole: null,
      isVerified,
      hasRealEmail: true,
    };
  }

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
    userResult?.data?.user?.email_confirmed_at != null;

  return {
    profile: profileData as unknown as Profile,
    primaryRole: (roleData?.role ?? null) as RoleType | null,
    isVerified,
    hasRealEmail: profileData.has_real_email,
  };
}

// Module-level ref so hydrate() can unsubscribe a stale listener if called again.
let authSubscription: { unsubscribe: () => void } | null = null;

const storeCreator: StateCreator<AuthState> = (set, get) => ({
  status: "loading",
  session: null,
  profile: null,
  primaryRole: null,
  pendingVerificationEmail: null,
  pendingVerificationRole: null,

  hydrate: async () => {
    // Subscribe BEFORE getSession() to close the race window where a session
    // change fires between the two calls and would be silently missed.
    authSubscription?.unsubscribe();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === "INITIAL_SESSION") return;

      if (!newSession) {
        set({
          status: "unauthenticated",
          session: null,
          profile: null,
          primaryRole: null,
          pendingVerificationEmail: null,
          pendingVerificationRole: null,
        });
        return;
      }

      set({ session: newSession });
    });

    authSubscription = subscription;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      set({
        status: "unauthenticated",
        session: null,
        profile: null,
        primaryRole: null,
      });
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
          // Keep the verify-email screen usable (it bails when this is null).
          pendingVerificationEmail: needsVerification
            ? (session.user.email ?? get().pendingVerificationEmail ?? null)
            : null,
        });
      } catch {
        set({
          status: "unauthenticated",
          session: null,
          profile: null,
          primaryRole: null,
        });
      }
    }
  },

  // Called once the caller holds a session for a confirmed email (password
  // sign-in or completed OTP). Loads profile/role and skips the getUser()
  // verification check. Unverified accounts never reach here — they route to
  // the verify-email screen via setVerificationPending() instead.
  signInComplete: async (session: Session) => {
    try {
      const { profile, primaryRole } = await fetchProfileAndRole(
        session.user.id,
        false,
      );

      set({
        session,
        profile,
        primaryRole,
        status: "authenticated",
        pendingVerificationEmail: null,
        pendingVerificationRole: null,
      });
    } catch {
      set({
        status: "unauthenticated",
        session: null,
        profile: null,
        primaryRole: null,
      });
      throw new Error("Unable to load your profile. Please try again.");
    }
  },

  setVerificationPending: (email: string, role?: RoleId) => {
    set({
      status: "needs_verification",
      pendingVerificationEmail: email,
      pendingVerificationRole: role ?? null,
    });
  },

  refreshProfile: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { profile, primaryRole, isVerified, hasRealEmail } =
        await fetchProfileAndRole(session.user.id, true, session);

      const needsVerification = hasRealEmail && !isVerified;

      set({
        session,
        profile,
        primaryRole,
        status: needsVerification ? "needs_verification" : "authenticated",
        pendingVerificationEmail: needsVerification
          ? (get().pendingVerificationEmail ?? session.user.email ?? null)
          : null,
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
      pendingVerificationRole: null,
    });
  },
});

export const useAuthStore = create<AuthState>(storeCreator);
