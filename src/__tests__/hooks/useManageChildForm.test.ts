import { useManageChildForm } from "@/src/hooks/useManageChildForm";
import {
  getChildProfile,
  updateChildProfile,
} from "@/src/services/parent.service";
import { act, renderHook, waitFor } from "@testing-library/react-native";

jest.mock("@/src/services/parent.service", () => ({
  getChildProfile: jest.fn(),
  updateChildProfile: jest.fn(),
}));

const mockGet = getChildProfile as jest.Mock;
const mockUpdate = updateChildProfile as jest.Mock;

const CHILD = {
  firstName: "Alice",
  lastName: "Smith",
  username: "alice",
  regionId: "r1",
  dateOfBirth: "2012-05-01",
  avatarUrl: null,
  profileSettingsLocked: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue(CHILD);
  mockUpdate.mockResolvedValue({ ok: true });
});

async function renderLoaded(childId = "c1") {
  const view = renderHook(() => useManageChildForm(childId));
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
}

describe("useManageChildForm", () => {
  it("loads the child profile into form state", async () => {
    const { result } = await renderLoaded();

    expect(result.current.firstName).toBe("Alice");
    expect(result.current.lastName).toBe("Smith");
    expect(result.current.username).toBe("alice");
    expect(result.current.regionId).toBe("r1");
    expect(result.current.dob).toBe("2012-05-01");
  });

  it("blocks save with a Required error when a field is empty", async () => {
    const { result } = await renderLoaded();

    act(() => result.current.setUsername("   "));

    let outcome;
    await act(async () => {
      outcome = await result.current.save();
    });

    expect(outcome).toEqual({ ok: false });
    expect(result.current.usernameError).toBe("Required");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("saves trimmed values and returns ok on success", async () => {
    const { result } = await renderLoaded();

    act(() => result.current.setFirstName("  Bob  "));

    let outcome;
    await act(async () => {
      outcome = await result.current.save();
    });

    expect(outcome).toEqual({ ok: true });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        childProfileId: "c1",
        firstName: "Bob",
        username: "alice",
      }),
    );
  });

  it("surfaces a username field error from the service", async () => {
    mockUpdate.mockResolvedValue({
      ok: false,
      field: "username",
      error: "That username is already taken.",
    });
    const { result } = await renderLoaded();

    let outcome;
    await act(async () => {
      outcome = await result.current.save();
    });

    expect(outcome).toEqual({ ok: false });
    expect(result.current.usernameError).toBe(
      "That username is already taken.",
    );
  });

  it("returns a non-field failure as an alert", async () => {
    mockUpdate.mockResolvedValue({ ok: false, error: "Network error" });
    const { result } = await renderLoaded();

    let outcome;
    await act(async () => {
      outcome = await result.current.save();
    });

    expect(outcome).toEqual({ ok: false, alert: "Network error" });
  });

  it("returns ok: false without calling the service when childId is missing", async () => {
    // No childId: the loader never runs and save() short-circuits.
    const { result } = renderHook(() => useManageChildForm(undefined));

    let outcome;
    await act(async () => {
      outcome = await result.current.save();
    });

    expect(outcome).toEqual({ ok: false });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
