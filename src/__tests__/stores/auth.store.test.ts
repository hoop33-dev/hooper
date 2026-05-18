import { useAuthStore } from "@/src/stores/auth.store";
import { supabase } from "@/src/lib/supabase";
import { signOut as authSignOut } from "@/src/services/auth.service";

jest.mock("@/src/lib/supabase", () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

jest.mock("@/src/services/auth.service", () => ({
  signOut: jest.fn(),
}));

const mockAuthStateChange = supabase.auth.onAuthStateChange as jest.Mock;
const mockGetSession = supabase.auth.getSession as jest.Mock;
const mockFrom = supabase.from as jest.Mock;
const mockAuthSignOut = authSignOut as jest.Mock;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a subscription stub accepted by hydrate(). */
function stubSubscription() {
  return {
    data: { subscription: { unsubscribe: jest.fn() } },
  };
}

/**
 * Configures mockFrom so that the first call returns a builder resolving
 * `profileResult` at .maybySingle(), and the second call (user_roles) resolves
 * `roleResult` at .maybySingle().
 */
function mockProfileAndRoleQueries(
  profileResult: unknown,
  roleResult: unknown,
) {
  let callCount = 0;
  mockFrom.mockImplementation(() => {
    callCount += 1;
    if (callCount === 1) {
      // profiles: .select("*").eq("auth_user_id", id).maybySingle()
      const maybeSingle = jest.fn().mockResolvedValue(profileResult);
      const eq = jest.fn().mockReturnValue({ maybeSingle });
      const select = jest.fn().mockReturnValue({ eq });
      return { select };
    }
    // user_roles: .select("role").eq(...).order(...).limit(...).maybySingle()
    const maybeSingle = jest.fn().mockResolvedValue(roleResult);
    const limit = jest.fn().mockReturnValue({ maybeSingle });
    const order = jest.fn().mockReturnValue({ limit });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    return { select };
  });
}

const initialStoreState = {
  status: "loading" as const,
  session: null,
  profile: null,
  primaryRole: null,
  pendingVerificationEmail: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState(initialStoreState);
});

// ─── setVerificationPending ───────────────────────────────────────────────────

describe("setVerificationPending", () => {
  it("transitions to needs_verification and stores the email", () => {
    useAuthStore.getState().setVerificationPending("verify@example.com");

    const { status, pendingVerificationEmail } = useAuthStore.getState();
    expect(status).toBe("needs_verification");
    expect(pendingVerificationEmail).toBe("verify@example.com");
  });
});

// ─── signOut ─────────────────────────────────────────────────────────────────

describe("signOut", () => {
  it("calls authSignOut and clears all auth state", async () => {
    mockAuthSignOut.mockResolvedValue(undefined);
    useAuthStore.setState({
      status: "authenticated",
      session: { user: { id: "u1" } } as any,
      profile: { id: "p1" } as any,
      primaryRole: "player",
      pendingVerificationEmail: null,
    });

    await useAuthStore.getState().signOut();

    expect(mockAuthSignOut).toHaveBeenCalledTimes(1);
    const { status, session, profile, primaryRole, pendingVerificationEmail } =
      useAuthStore.getState();
    expect(status).toBe("unauthenticated");
    expect(session).toBeNull();
    expect(profile).toBeNull();
    expect(primaryRole).toBeNull();
    expect(pendingVerificationEmail).toBeNull();
  });
});

// ─── signInComplete ───────────────────────────────────────────────────────────

describe("signInComplete", () => {
  const fakeSession = {
    user: { id: "u1", email: "user@example.com" },
  } as any;

  it("sets authenticated state when the profile loads", async () => {
    const fakeProfile = { id: "p1", auth_user_id: "u1", has_real_email: true };
    mockProfileAndRoleQueries(
      { data: fakeProfile, error: null },
      { data: { role: "player" }, error: null },
    );

    await useAuthStore.getState().signInComplete(fakeSession);

    const { status, primaryRole, pendingVerificationEmail } =
      useAuthStore.getState();
    expect(status).toBe("authenticated");
    expect(primaryRole).toBe("player");
    expect(pendingVerificationEmail).toBeNull();
  });

  it("sets authenticated when profile has no role", async () => {
    const fakeProfile = { id: "p1", auth_user_id: "u1", has_real_email: true };
    mockProfileAndRoleQueries(
      { data: fakeProfile, error: null },
      { data: null, error: null },
    );

    await useAuthStore.getState().signInComplete(fakeSession);

    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(useAuthStore.getState().primaryRole).toBeNull();
  });

  it("clears state and throws when the DB fetch fails", async () => {
    mockFrom.mockImplementation(() => {
      throw new Error("db error");
    });

    await expect(
      useAuthStore.getState().signInComplete(fakeSession),
    ).rejects.toThrow("Unable to load your profile");

    const { status, session, profile } = useAuthStore.getState();
    expect(status).toBe("unauthenticated");
    expect(session).toBeNull();
    expect(profile).toBeNull();
  });
});

// ─── refreshProfile ───────────────────────────────────────────────────────────

describe("refreshProfile", () => {
  it("does nothing when there is no active session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    await useAuthStore.getState().refreshProfile();

    expect(mockFrom).not.toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe("loading"); // unchanged
  });

  it("updates profile and role from the database on success", async () => {
    const fakeSession = {
      user: {
        id: "u1",
        email: "u@example.com",
        email_confirmed_at: "2026-01-01T00:00:00Z",
      },
    } as any;
    mockGetSession.mockResolvedValue({ data: { session: fakeSession } });

    const fakeProfile = { id: "p1", auth_user_id: "u1", has_real_email: true };
    mockProfileAndRoleQueries(
      { data: fakeProfile, error: null },
      { data: { role: "coach" }, error: null },
    );

    await useAuthStore.getState().refreshProfile();

    const { status, primaryRole } = useAuthStore.getState();
    expect(status).toBe("authenticated");
    expect(primaryRole).toBe("coach");
  });

  it("does not change status on a DB error (silently absorbs it)", async () => {
    const fakeSession = { user: { id: "u1" } } as any;
    mockGetSession.mockResolvedValue({ data: { session: fakeSession } });
    useAuthStore.setState({ status: "authenticated" });

    mockFrom.mockImplementation(() => {
      throw new Error("db error");
    });

    await useAuthStore.getState().refreshProfile();

    expect(useAuthStore.getState().status).toBe("authenticated"); // unchanged
  });
});

// ─── hydrate ─────────────────────────────────────────────────────────────────

describe("hydrate", () => {
  it("sets unauthenticated when there is no session", async () => {
    mockAuthStateChange.mockReturnValue(stubSubscription());
    mockGetSession.mockResolvedValue({ data: { session: null } });

    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().status).toBe("unauthenticated");
  });

  it("sets authenticated for a session with a confirmed email", async () => {
    const fakeSession = {
      user: {
        id: "u1",
        email: "u@example.com",
        email_confirmed_at: "2026-01-01T00:00:00Z",
      },
    } as any;
    mockAuthStateChange.mockReturnValue(stubSubscription());
    mockGetSession.mockResolvedValue({ data: { session: fakeSession } });

    const fakeProfile = { id: "p1", auth_user_id: "u1", has_real_email: true };
    mockProfileAndRoleQueries(
      { data: fakeProfile, error: null },
      { data: { role: "player" }, error: null },
    );

    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().status).toBe("authenticated");
  });

  it("sets needs_verification for a real-email account whose email is unconfirmed", async () => {
    const fakeSession = {
      user: { id: "u1", email: "u@example.com" }, // no email_confirmed_at
    } as any;
    mockAuthStateChange.mockReturnValue(stubSubscription());
    mockGetSession.mockResolvedValue({ data: { session: fakeSession } });

    // has_real_email=true, email not confirmed → getUser() called (returns unconfirmed)
    const fakeProfile = { id: "p1", auth_user_id: "u1", has_real_email: true };
    mockProfileAndRoleQueries(
      { data: fakeProfile, error: null },
      { data: { role: "player" }, error: null },
    );
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { email_confirmed_at: null } },
    });

    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().status).toBe("needs_verification");
    expect(useAuthStore.getState().pendingVerificationEmail).toBe(
      "u@example.com",
    );
  });

  it("sets authenticated for a child account (has_real_email=false)", async () => {
    const fakeSession = {
      user: { id: "u1" }, // no email_confirmed_at
    } as any;
    mockAuthStateChange.mockReturnValue(stubSubscription());
    mockGetSession.mockResolvedValue({ data: { session: fakeSession } });

    const fakeProfile = { id: "p1", auth_user_id: "u1", has_real_email: false };
    mockProfileAndRoleQueries(
      { data: fakeProfile, error: null },
      { data: { role: "player" }, error: null },
    );

    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().status).toBe("authenticated");
  });

  it("sets unauthenticated when the DB fetch throws", async () => {
    const fakeSession = { user: { id: "u1" } } as any;
    mockAuthStateChange.mockReturnValue(stubSubscription());
    mockGetSession.mockResolvedValue({ data: { session: fakeSession } });

    mockFrom.mockImplementation(() => {
      throw new Error("db error");
    });

    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().status).toBe("unauthenticated");
  });

  it("sets needs_verification when profile is missing and the email is unconfirmed", async () => {
    const fakeSession = {
      user: { id: "u1", email: "u@example.com" }, // no email_confirmed_at
    } as any;
    mockAuthStateChange.mockReturnValue(stubSubscription());
    mockGetSession.mockResolvedValue({ data: { session: fakeSession } });

    // Profile lookup returns null (e.g. trigger lag right after signUp).
    mockProfileAndRoleQueries({ data: null, error: null }, null);
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { email_confirmed_at: null } },
    });

    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().status).toBe("needs_verification");
    // Must be populated or the verify-email screen bounces and the route guard
    // bounces back — an infinite redirect loop.
    expect(useAuthStore.getState().pendingVerificationEmail).toBe(
      "u@example.com",
    );
  });

  it("sets authenticated when profile is missing but the session is already confirmed", async () => {
    const fakeSession = {
      user: {
        id: "u1",
        email: "u@example.com",
        email_confirmed_at: "2026-01-01T00:00:00Z",
      },
    } as any;
    mockAuthStateChange.mockReturnValue(stubSubscription());
    mockGetSession.mockResolvedValue({ data: { session: fakeSession } });

    mockProfileAndRoleQueries({ data: null, error: null }, null);

    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().status).toBe("authenticated");
  });

  it("unsubscribes a previous listener before creating a new one", async () => {
    const unsubscribe = jest.fn();
    mockAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    });
    mockGetSession.mockResolvedValue({ data: { session: null } });

    await useAuthStore.getState().hydrate();
    await useAuthStore.getState().hydrate();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
