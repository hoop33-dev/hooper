import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useChildren } from "@/src/hooks/useChildren";
import { listChildren } from "@/src/services/parent.service";

// Suppress act() warnings caused by async state updates inside useEffect.
// The updates are expected; waitFor/act in each test properly handles them.
const originalError = console.error.bind(console.error);
beforeAll(() => {
  console.error = (msg: string, ...args: unknown[]) => {
    if (typeof msg === "string" && msg.includes("not wrapped in act")) return;
    originalError(msg, ...args);
  };
});
afterAll(() => {
  console.error = originalError;
});

jest.mock("@/src/services/parent.service", () => ({
  listChildren: jest.fn(),
}));

const mockListChildren = listChildren as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe("useChildren", () => {
  it("starts with isLoading=true and an empty children array", () => {
    mockListChildren.mockResolvedValue([]);
    const { result } = renderHook(() => useChildren());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.children).toEqual([]);
  });

  it("sets isLoading to false after the initial fetch resolves", async () => {
    mockListChildren.mockResolvedValue([]);
    const { result } = renderHook(() => useChildren());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("populates children after a successful fetch", async () => {
    const children = [
      { id: "c1", firstName: "Alice", lastName: "Smith", username: "alice" },
    ];
    mockListChildren.mockResolvedValue(children);

    const { result } = renderHook(() => useChildren());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.children).toEqual(children);
  });

  it("keeps children as an empty array when the service returns nothing", async () => {
    mockListChildren.mockResolvedValue([]);

    const { result } = renderHook(() => useChildren());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.children).toEqual([]);
  });

  it("re-fetches and updates children when refresh() is called", async () => {
    mockListChildren.mockResolvedValue([]);
    const { result } = renderHook(() => useChildren());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const updatedChildren = [
      { id: "c2", firstName: "Bob", lastName: "Jones", username: "bob" },
    ];
    mockListChildren.mockResolvedValue(updatedChildren);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.children).toEqual(updatedChildren);
    expect(mockListChildren).toHaveBeenCalledTimes(2);
  });

  it("sets isLoading=true during a refresh", async () => {
    mockListChildren.mockResolvedValue([]);
    const { result } = renderHook(() => useChildren());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let resolveRefresh!: (v: unknown[]) => void;
    mockListChildren.mockReturnValue(
      new Promise((res) => {
        resolveRefresh = res;
      }),
    );

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(true));

    await act(async () => {
      resolveRefresh([]);
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("calls listChildren once on mount", async () => {
    mockListChildren.mockResolvedValue([]);
    renderHook(() => useChildren());

    await waitFor(() => expect(mockListChildren).toHaveBeenCalledTimes(1));
  });
});
