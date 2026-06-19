import { supabase } from "@/src/lib/supabase";
import {
  createChildAccount,
  getChildProfile,
  getGuardianControls,
  listChildren,
  updateChildProfile,
} from "@/src/services/parent.service";

jest.mock("@/src/lib/supabase", () => ({
  supabase: {
    functions: { invoke: jest.fn() },
    from: jest.fn(),
  },
}));

const mockInvoke = supabase.functions.invoke as jest.Mock;
const mockFrom = supabase.from as jest.Mock;

beforeEach(() => jest.clearAllMocks());

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds a chainable Supabase query builder where the terminal method
 * (`.eq()` or `.in()`) resolves with the supplied value.
 */
function makeTerminalEqBuilder(resolveValue: unknown) {
  const eq = jest.fn().mockResolvedValue(resolveValue);
  const select = jest.fn().mockReturnValue({ eq });
  return { select };
}

function makeTerminalInBuilder(resolveValue: unknown) {
  const inFn = jest.fn().mockResolvedValue(resolveValue);
  const select = jest.fn().mockReturnValue({ in: inFn });
  return { select };
}

/** `.select(...).eq(...).maybeSingle()` */
function makeMaybeSingleEqBuilder(resolveValue: unknown) {
  const maybeSingle = jest.fn().mockResolvedValue(resolveValue);
  const eq = jest.fn().mockReturnValue({ maybeSingle });
  const select = jest.fn().mockReturnValue({ eq });
  return { select };
}

/** `.select(...).eq(...).eq(...).maybeSingle()` */
function makeMaybeSingleEqEqBuilder(resolveValue: unknown) {
  const maybeSingle = jest.fn().mockResolvedValue(resolveValue);
  const eq2 = jest.fn().mockReturnValue({ maybeSingle });
  const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
  const select = jest.fn().mockReturnValue({ eq: eq1 });
  return { select };
}

// ─── createChildAccount ───────────────────────────────────────────────────────

describe("createChildAccount", () => {
  const validInput = {
    firstName: "Alice",
    lastName: "Smith",
    username: "alicesmith",
    password: "Password1",
    dateOfBirth: new Date(2012, 5, 15), // June 15, 2012
  };

  it("returns ok: true with mapped child data on success", async () => {
    mockInvoke.mockResolvedValue({
      data: {
        ok: true,
        child: {
          id: "c1",
          firstName: "Alice",
          lastName: "Smith",
          username: "alicesmith",
        },
      },
      error: null,
    });

    const result = await createChildAccount(validInput);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.child).toEqual({
        id: "c1",
        firstName: "Alice",
        lastName: "Smith",
        username: "alicesmith",
      });
    }
    expect(mockInvoke).toHaveBeenCalledWith(
      "create-child-account",
      expect.objectContaining({ body: expect.any(Object) }),
    );
  });

  it("returns ok: false with a generic error when the edge function throws", async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: new Error("network error"),
    });

    const result = await createChildAccount(validInput);

    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.error).toMatch(/unable to create child account/i);
  });

  it("returns ok: false with field when data.ok is false", async () => {
    mockInvoke.mockResolvedValue({
      data: { ok: false, field: "username", error: "Username already taken" },
      error: null,
    });

    const result = await createChildAccount(validInput);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.field).toBe("username");
      expect(result.error).toBe("Username already taken");
    }
  });

  it("falls back to generic error text when data.error is absent", async () => {
    mockInvoke.mockResolvedValue({
      data: { ok: false },
      error: null,
    });

    const result = await createChildAccount(validInput);

    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.error).toMatch(/unable to create child account/i);
  });

  it("formats dateOfBirth as YYYY-MM-DD", async () => {
    mockInvoke.mockResolvedValue({
      data: {
        ok: true,
        child: {
          id: "c2",
          firstName: "Alice",
          lastName: "Smith",
          username: "alice",
        },
      },
      error: null,
    });

    await createChildAccount({
      ...validInput,
      dateOfBirth: new Date(2012, 0, 5),
    }); // Jan 5

    expect(mockInvoke).toHaveBeenCalledWith(
      "create-child-account",
      expect.objectContaining({
        body: expect.objectContaining({ dateOfBirth: "2012-01-05" }),
      }),
    );
  });

  it("passes null for optional regionSlug and mobile when omitted", async () => {
    mockInvoke.mockResolvedValue({
      data: {
        ok: true,
        child: {
          id: "c3",
          firstName: "Alice",
          lastName: "Smith",
          username: "alice",
        },
      },
      error: null,
    });

    await createChildAccount(validInput);

    expect(mockInvoke).toHaveBeenCalledWith(
      "create-child-account",
      expect.objectContaining({
        body: expect.objectContaining({ regionSlug: null, mobile: null }),
      }),
    );
  });
});

// ─── listChildren ─────────────────────────────────────────────────────────────

describe("listChildren", () => {
  it("returns an empty array when the links query errors", async () => {
    mockFrom.mockReturnValue(
      makeTerminalEqBuilder({ data: null, error: new Error("db error") }),
    );

    const result = await listChildren();

    expect(result).toEqual([]);
  });

  it("returns an empty array when there are no active links", async () => {
    mockFrom.mockReturnValue(makeTerminalEqBuilder({ data: [], error: null }));

    const result = await listChildren();

    expect(result).toEqual([]);
  });

  it("returns mapped children when links and profiles both exist", async () => {
    mockFrom
      .mockReturnValueOnce(
        makeTerminalEqBuilder({
          data: [{ player_profile_id: "p1" }],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        makeTerminalInBuilder({
          data: [
            {
              id: "p1",
              first_name: "Alice",
              last_name: "Smith",
              username: "alice",
            },
          ],
          error: null,
        }),
      );

    const result = await listChildren();

    expect(result).toEqual([
      { id: "p1", firstName: "Alice", lastName: "Smith", username: "alice" },
    ]);
  });

  it("returns an empty array when the profiles query errors", async () => {
    mockFrom
      .mockReturnValueOnce(
        makeTerminalEqBuilder({
          data: [{ player_profile_id: "p1" }],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        makeTerminalInBuilder({ data: null, error: new Error("db error") }),
      );

    const result = await listChildren();

    expect(result).toEqual([]);
  });

  it("maps multiple children correctly", async () => {
    mockFrom
      .mockReturnValueOnce(
        makeTerminalEqBuilder({
          data: [{ player_profile_id: "p1" }, { player_profile_id: "p2" }],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        makeTerminalInBuilder({
          data: [
            {
              id: "p1",
              first_name: "Alice",
              last_name: "Smith",
              username: "alice",
            },
            {
              id: "p2",
              first_name: "Bob",
              last_name: "Jones",
              username: "bob",
            },
          ],
          error: null,
        }),
      );

    const result = await listChildren();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: "p1",
      firstName: "Alice",
      lastName: "Smith",
      username: "alice",
    });
    expect(result[1]).toEqual({
      id: "p2",
      firstName: "Bob",
      lastName: "Jones",
      username: "bob",
    });
  });
});

// ─── getGuardianControls ──────────────────────────────────────────────────────

describe("getGuardianControls", () => {
  it("reports unmanaged when the player has no link", async () => {
    mockFrom.mockReturnValue(
      makeMaybeSingleEqBuilder({ data: null, error: null }),
    );

    expect(await getGuardianControls()).toEqual({
      isManaged: false,
      profileSettingsLocked: false,
    });
  });

  it("reports managed and the lock state when a link exists", async () => {
    mockFrom.mockReturnValue(
      makeMaybeSingleEqBuilder({
        data: { profile_settings_locked: true },
        error: null,
      }),
    );

    expect(await getGuardianControls()).toEqual({
      isManaged: true,
      profileSettingsLocked: true,
    });
  });

  it("reports unmanaged on query error", async () => {
    mockFrom.mockReturnValue(
      makeMaybeSingleEqBuilder({ data: null, error: new Error("db") }),
    );

    expect(await getGuardianControls()).toEqual({
      isManaged: false,
      profileSettingsLocked: false,
    });
  });
});

// ─── getChildProfile ──────────────────────────────────────────────────────────

describe("getChildProfile", () => {
  it("maps the profile and lock flag", async () => {
    mockFrom
      .mockReturnValueOnce(
        makeMaybeSingleEqBuilder({
          data: {
            id: "p1",
            first_name: "Alice",
            last_name: "Smith",
            username: "alice",
            date_of_birth: "2012-01-05",
            region_id: "r1",
            avatar_url: null,
          },
          error: null,
        }),
      )
      .mockReturnValueOnce(
        makeMaybeSingleEqEqBuilder({
          data: { profile_settings_locked: true },
          error: null,
        }),
      );

    expect(await getChildProfile("p1")).toEqual({
      id: "p1",
      firstName: "Alice",
      lastName: "Smith",
      username: "alice",
      dateOfBirth: "2012-01-05",
      regionId: "r1",
      avatarUrl: null,
      profileSettingsLocked: true,
    });
  });

  it("returns null when the profile can't be read", async () => {
    mockFrom.mockReturnValueOnce(
      makeMaybeSingleEqBuilder({ data: null, error: null }),
    );

    expect(await getChildProfile("p1")).toBeNull();
  });

  it("defaults the lock flag to false when there's no link row", async () => {
    mockFrom
      .mockReturnValueOnce(
        makeMaybeSingleEqBuilder({
          data: {
            id: "p1",
            first_name: "Alice",
            last_name: "Smith",
            username: "alice",
            date_of_birth: null,
            region_id: null,
            avatar_url: null,
          },
          error: null,
        }),
      )
      .mockReturnValueOnce(
        makeMaybeSingleEqEqBuilder({ data: null, error: null }),
      );

    const result = await getChildProfile("p1");
    expect(result?.profileSettingsLocked).toBe(false);
  });
});

// ─── updateChildProfile ───────────────────────────────────────────────────────

describe("updateChildProfile", () => {
  const baseInput = {
    childProfileId: "p1",
    firstName: "Alice",
    lastName: "Smith",
    username: "alice",
    regionId: "r1",
    profileSettingsLocked: true,
  };

  it("returns ok and formats the date of birth", async () => {
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null });

    const result = await updateChildProfile({
      ...baseInput,
      dateOfBirth: new Date(2012, 0, 5),
    });

    expect(result.ok).toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith(
      "update-child-profile",
      expect.objectContaining({
        body: expect.objectContaining({
          dateOfBirth: "2012-01-05",
          profileSettingsLocked: true,
        }),
      }),
    );
  });

  it("sends null dateOfBirth when omitted", async () => {
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null });

    await updateChildProfile({ ...baseInput, dateOfBirth: null });

    expect(mockInvoke).toHaveBeenCalledWith(
      "update-child-profile",
      expect.objectContaining({
        body: expect.objectContaining({ dateOfBirth: null }),
      }),
    );
  });

  it("surfaces a username field error", async () => {
    mockInvoke.mockResolvedValue({
      data: { ok: false, field: "username", error: "Username taken" },
      error: null,
    });

    const result = await updateChildProfile({
      ...baseInput,
      dateOfBirth: null,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.field).toBe("username");
      expect(result.error).toBe("Username taken");
    }
  });

  it("returns a generic error when the function transport fails", async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error("network") });

    const result = await updateChildProfile({
      ...baseInput,
      dateOfBirth: null,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/unable to save/i);
  });
});
