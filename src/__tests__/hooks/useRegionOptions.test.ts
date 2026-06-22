import { useRegionOptions } from "@/src/hooks/useRegionOptions";
import { listRegionOptions } from "@/src/services/region.service";
import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("@/src/services/region.service", () => ({
  listRegionOptions: jest.fn(),
}));

const mockList = listRegionOptions as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe("useRegionOptions", () => {
  it("starts empty before the fetch resolves", () => {
    mockList.mockResolvedValue([]);
    const { result } = renderHook(() => useRegionOptions());
    expect(result.current).toEqual([]);
  });

  it("populates options after the service resolves", async () => {
    const options = [{ value: "r1", label: "Auckland" }];
    mockList.mockResolvedValue(options);

    const { result } = renderHook(() => useRegionOptions());

    await waitFor(() => expect(result.current).toEqual(options));
    expect(mockList).toHaveBeenCalledTimes(1);
  });

  it("ignores a late resolution after unmount (no state update)", async () => {
    let resolve!: (v: unknown[]) => void;
    mockList.mockReturnValue(new Promise((r) => (resolve = r)));

    const { result, unmount } = renderHook(() => useRegionOptions());
    unmount();
    resolve([{ value: "r1", label: "Auckland" }]);

    // Still the initial value; the cancelled flag prevented the setState.
    expect(result.current).toEqual([]);
  });
});
