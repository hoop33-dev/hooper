import { useGuardianControls } from "@/src/hooks/useGuardianControls";
import { getGuardianControls } from "@/src/services/parent.service";
import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("@/src/services/parent.service", () => ({
  getGuardianControls: jest.fn(),
}));

const mockGet = getGuardianControls as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe("useGuardianControls", () => {
  it("loads controls and clears isLoading when enabled", async () => {
    mockGet.mockResolvedValue({
      isManaged: true,
      profileSettingsLocked: true,
    });

    const { result } = renderHook(() => useGuardianControls());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isManaged).toBe(true);
    expect(result.current.profileSettingsLocked).toBe(true);
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it("skips the lookup and returns defaults when disabled", async () => {
    const { result } = renderHook(() => useGuardianControls(false));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isManaged).toBe(false);
    expect(result.current.profileSettingsLocked).toBe(false);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("re-fetches when the enabled flag flips on", async () => {
    mockGet.mockResolvedValue({
      isManaged: true,
      profileSettingsLocked: false,
    });

    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useGuardianControls(enabled),
      { initialProps: { enabled: false } },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockGet).not.toHaveBeenCalled();

    rerender({ enabled: true });

    await waitFor(() => expect(result.current.isManaged).toBe(true));
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});
