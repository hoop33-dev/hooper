import { supabase } from "@/src/lib/supabase";
import {
  checkUsernameAvailable,
  signInWithUsername,
  signOut,
  verifyEmailOtp,
  resendVerificationOtp,
  signUp,
} from "@/src/services/auth.service";

jest.mock("@/src/lib/supabase", () => ({
  supabase: {
    rpc: jest.fn(),
    functions: { invoke: jest.fn() },
    auth: {
      setSession: jest.fn(),
      signOut: jest.fn(),
      verifyOtp: jest.fn(),
      resend: jest.fn(),
      signUp: jest.fn(),
      signInWithOtp: jest.fn(),
    },
  },
}));

const mockRpc = supabase.rpc as jest.Mock;
const mockInvoke = supabase.functions.invoke as jest.Mock;
const mockSetSession = supabase.auth.setSession as jest.Mock;
const mockAuthSignOut = supabase.auth.signOut as jest.Mock;
const mockVerifyOtp = supabase.auth.verifyOtp as jest.Mock;
const mockResend = supabase.auth.resend as jest.Mock;
const mockAuthSignUp = supabase.auth.signUp as jest.Mock;
const mockSignInWithOtp = supabase.auth.signInWithOtp as jest.Mock;

const fakeSession = { user: { id: "u1", email: "test@example.com" } } as any;

beforeEach(() => {
  jest.clearAllMocks();
  mockSignInWithOtp.mockResolvedValue({ data: {}, error: null });
});

// ─── checkUsernameAvailable ───────────────────────────────────────────────────

describe("checkUsernameAvailable", () => {
  it("returns true when the username is available", async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });
    await expect(checkUsernameAvailable("newuser")).resolves.toBe(true);
    expect(mockRpc).toHaveBeenCalledWith("is_username_available", {
      p_username: "newuser",
    });
  });

  it("returns false when the username is taken", async () => {
    mockRpc.mockResolvedValue({ data: false, error: null });
    await expect(checkUsernameAvailable("takenuser")).resolves.toBe(false);
  });

  it("returns null on RPC error", async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error("rpc error") });
    await expect(checkUsernameAvailable("anyuser")).resolves.toBeNull();
  });
});

// ─── signInWithUsername ───────────────────────────────────────────────────────

describe("signInWithUsername", () => {
  it("returns ok: true with session and requiresVerification=false", async () => {
    mockInvoke.mockResolvedValue({
      data: { ok: true, session: fakeSession, requires_verification: false },
      error: null,
    });
    mockSetSession.mockResolvedValue({ data: { session: fakeSession } });

    const result = await signInWithUsername("user", "Password1");

    expect(result.ok).toBe(true);
    if (result.ok && !result.requiresVerification) {
      expect(result.session).toEqual(fakeSession);
    }
  });

  it("returns requiresVerification with the email and no session for unverified accounts", async () => {
    mockInvoke.mockResolvedValue({
      data: {
        ok: true,
        session: null,
        requires_verification: true,
        email_for_otp: "u@example.com",
      },
      error: null,
    });

    const result = await signInWithUsername("user", "Password1");

    expect(result.ok).toBe(true);
    if (result.ok && result.requiresVerification) {
      expect(result.email).toBe("u@example.com");
    }
    // No session to set when verification is still required.
    expect(mockSetSession).not.toHaveBeenCalled();
  });

  it("returns ok: false when the edge function throws", async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: new Error("network error"),
    });

    const result = await signInWithUsername("user", "Password1");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Unable to sign in");
  });

  it("returns the server error message when data.ok is false", async () => {
    mockInvoke.mockResolvedValue({
      data: { ok: false, error: "Invalid credentials" },
      error: null,
    });

    const result = await signInWithUsername("user", "badpass");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Invalid credentials");
  });

  it("falls back to a default error message when data.error is absent", async () => {
    mockInvoke.mockResolvedValue({
      data: { ok: false },
      error: null,
    });

    const result = await signInWithUsername("user", "badpass");

    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.error).toContain("Invalid username or password");
  });

  it("returns ok: false when setSession yields no session", async () => {
    mockInvoke.mockResolvedValue({
      data: { ok: true, session: fakeSession },
      error: null,
    });
    mockSetSession.mockResolvedValue({ data: { session: null } });

    const result = await signInWithUsername("user", "Password1");

    expect(result.ok).toBe(false);
  });
});

// ─── signOut ─────────────────────────────────────────────────────────────────

describe("signOut", () => {
  it("delegates to supabase.auth.signOut", async () => {
    mockAuthSignOut.mockResolvedValue({ error: null });
    await signOut();
    expect(mockAuthSignOut).toHaveBeenCalledTimes(1);
  });
});

// ─── verifyEmailOtp ───────────────────────────────────────────────────────────

describe("verifyEmailOtp", () => {
  it("returns ok: true with session on success", async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { session: fakeSession },
      error: null,
    });

    const result = await verifyEmailOtp("test@example.com", "123456");

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.session).toEqual(fakeSession);
    expect(mockVerifyOtp).toHaveBeenCalledWith({
      email: "test@example.com",
      token: "123456",
      type: "signup",
    });
  });

  it('returns an "expired" message for an expired OTP', async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { session: null },
      error: { message: "Token has expired" },
    });

    const result = await verifyEmailOtp("test@example.com", "000000");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/expired/i);
  });

  it("returns a generic invalid-code message for other OTP errors", async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid OTP supplied" },
    });

    const result = await verifyEmailOtp("test@example.com", "999999");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/invalid code/i);
  });

  it("returns ok: false when there is no session despite no error", async () => {
    mockVerifyOtp.mockResolvedValue({ data: { session: null }, error: null });

    const result = await verifyEmailOtp("test@example.com", "123456");

    expect(result.ok).toBe(false);
  });
});

// ─── resendVerificationOtp ────────────────────────────────────────────────────

describe("resendVerificationOtp", () => {
  it("returns ok: true on success", async () => {
    mockResend.mockResolvedValue({ error: null });

    const result = await resendVerificationOtp("test@example.com");

    expect(result.ok).toBe(true);
    expect(mockResend).toHaveBeenCalledWith({
      email: "test@example.com",
      type: "signup",
    });
  });

  it("returns rate-limit error with parsed retryAfterSeconds", async () => {
    mockResend.mockResolvedValue({
      error: { message: "Rate limit exceeded. Retry after 30 seconds." },
    });

    const result = await resendVerificationOtp("test@example.com");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/too many requests/i);
      expect(result.retryAfterSeconds).toBe(30);
    }
  });

  it("returns rate-limit error with default 60s when no number found", async () => {
    mockResend.mockResolvedValue({
      error: { message: "Rate limit exceeded." },
    });

    const result = await resendVerificationOtp("test@example.com");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/too many requests/i);
      expect(result.retryAfterSeconds).toBe(60);
    }
  });

  it("triggers rate-limit path when message contains '429'", async () => {
    mockResend.mockResolvedValue({
      error: { message: "429 Too Many Requests" },
    });

    const result = await resendVerificationOtp("test@example.com");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/too many requests/i);
  });

  it("returns the raw error message for non-rate-limit errors", async () => {
    mockResend.mockResolvedValue({
      error: { message: "Email not found" },
    });

    const result = await resendVerificationOtp("test@example.com");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Email not found");
  });
});

// ─── signUp ───────────────────────────────────────────────────────────────────

describe("signUp", () => {
  const validParams = {
    firstName: "John",
    lastName: "Doe",
    username: "johndoe",
    email: "john@example.com",
    mobile: "+64211234567",
    regionSlug: "auckland",
    password: "Password1",
    role: "player" as const,
  };

  it("returns ok: false with a retryable error when the username RPC fails", async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error("rpc error") });

    const result = await signUp(validParams);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/unable to verify username/i);
  });

  it("returns ok: false with field='username' when the username is taken", async () => {
    mockRpc.mockResolvedValue({ data: false, error: null });

    const result = await signUp(validParams);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.field).toBe("username");
      expect(result.error).toMatch(/already taken/i);
    }
  });

  it("returns ok: true on a successful sign-up", async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });
    mockAuthSignUp.mockResolvedValue({
      data: { user: { id: "u1", identities: [{ id: "i1" }] }, session: null },
      error: null,
    });

    const result = await signUp(validParams);

    expect(result.ok).toBe(true);
    expect(mockSignInWithOtp).not.toHaveBeenCalled();
  });

  it("clears any persisted session after a successful sign-up so the user must complete OTP verification", async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });
    mockAuthSignUp.mockResolvedValue({ data: {}, error: null });
    mockAuthSignOut.mockResolvedValue({ error: null });

    await signUp(validParams);

    expect(mockAuthSignOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("does not call signOut when sign-up fails", async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });
    mockAuthSignUp.mockResolvedValue({
      data: {},
      error: { message: "User already registered" },
    });

    await signUp(validParams);

    expect(mockAuthSignOut).not.toHaveBeenCalled();
  });

  it("returns ok: false with field='email' when the email is already registered", async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });
    mockAuthSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "User already registered" },
    });

    const result = await signUp(validParams);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.field).toBe("email");
      expect(result.error).toMatch(/email already exists/i);
    }
  });

  it("also catches 'already exists' phrasing for duplicate email errors", async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });
    mockAuthSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Email already exists" },
    });

    const result = await signUp(validParams);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.field).toBe("email");
  });

  it("detects a duplicate email when GoTrue returns an obfuscated user", async () => {
    // With email confirmations enabled, GoTrue hides duplicate sign-ups by
    // returning a fabricated user whose `identities` array is empty.
    mockRpc.mockResolvedValue({ data: true, error: null });
    mockAuthSignUp.mockResolvedValue({
      data: { user: { id: "obfuscated", identities: [] }, session: null },
      error: null,
    });

    const result = await signUp(validParams);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.field).toBe("email");
      expect(result.error).toMatch(/email already exists/i);
    }
  });

  it("sends the 'account already exists' email when a duplicate is detected", async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });
    mockAuthSignUp.mockResolvedValue({
      data: { user: { id: "obfuscated", identities: [] }, session: null },
      error: null,
    });

    await signUp(validParams);

    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: validParams.email,
      options: { shouldCreateUser: false },
    });
  });

  it("sends the 'account already exists' email on the 'already registered' error path", async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });
    mockAuthSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "User already registered" },
    });

    await signUp(validParams);

    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: validParams.email,
      options: { shouldCreateUser: false },
    });
  });

  it("still reports the duplicate when the notification email fails to send", async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });
    mockAuthSignUp.mockResolvedValue({
      data: { user: { id: "obfuscated", identities: [] }, session: null },
      error: null,
    });
    mockSignInWithOtp.mockRejectedValue(new Error("rate limited"));

    const result = await signUp(validParams);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.field).toBe("email");
  });

  it("does not send the 'account already exists' email for other sign-up errors", async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });
    mockAuthSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Signup service unavailable" },
    });

    await signUp(validParams);

    expect(mockSignInWithOtp).not.toHaveBeenCalled();
  });

  it("returns ok: false with the raw error message for other sign-up errors", async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });
    mockAuthSignUp.mockResolvedValue({
      data: {},
      error: { message: "Signup service unavailable" },
    });

    const result = await signUp(validParams);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Signup service unavailable");
  });

  it("formats dateOfBirth as YYYY-MM-DD when provided", async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });
    mockAuthSignUp.mockResolvedValue({ data: {}, error: null });

    await signUp({ ...validParams, dateOfBirth: new Date(2000, 0, 5) }); // Jan 5, 2000

    expect(mockAuthSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          data: expect.objectContaining({ date_of_birth: "2000-01-05" }),
        }),
      }),
    );
  });

  it("sends null for dateOfBirth when not provided", async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });
    mockAuthSignUp.mockResolvedValue({ data: {}, error: null });

    await signUp({ ...validParams, dateOfBirth: null });

    expect(mockAuthSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          data: expect.objectContaining({ date_of_birth: null }),
        }),
      }),
    );
  });

  it("lowercases the username before sending to supabase", async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });
    mockAuthSignUp.mockResolvedValue({ data: {}, error: null });

    await signUp({ ...validParams, username: "JohnDoe" });

    expect(mockAuthSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          data: expect.objectContaining({ username: "johndoe" }),
        }),
      }),
    );
  });
});
