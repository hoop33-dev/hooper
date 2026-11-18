import { useAutoFinalizeSession } from "@/src/hooks/useAutoFinalizeSession";
import { renderHook, waitFor } from "@testing-library/react-native";

const mockCompleteSession = jest.fn();

jest.mock("@/src/services/sessionCompletion.service", () => ({
  completeSession: (...args: unknown[]) => mockCompleteSession(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockCompleteSession.mockResolvedValue({ id: "c1", status: "completed" });
});

describe("useAutoFinalizeSession", () => {
  it("does nothing while sets remain", () => {
    const { result } = renderHook(() => useAutoFinalizeSession("c1", 3, 4));
    expect(mockCompleteSession).not.toHaveBeenCalled();
    expect(result.current).toBe(false);
  });

  it("completes the attempt as soon as the last set is logged, once", async () => {
    const { result, rerender } = renderHook(
      ({ done }: { done: number }) => useAutoFinalizeSession("c1", done, 4),
      { initialProps: { done: 3 } },
    );
    rerender({ done: 4 });
    await waitFor(() => expect(result.current).toBe(true));
    expect(mockCompleteSession).toHaveBeenCalledWith("c1", null);

    // Unticking and re-ticking doesn't fire a second completion.
    rerender({ done: 3 });
    rerender({ done: 4 });
    expect(mockCompleteSession).toHaveBeenCalledTimes(1);
  });

  it("re-arms after a failed attempt", async () => {
    mockCompleteSession.mockRejectedValueOnce(new Error("network"));
    jest.spyOn(console, "warn").mockImplementation(() => {});
    const { result, rerender } = renderHook(
      ({ done }: { done: number }) => useAutoFinalizeSession("c1", done, 2),
      { initialProps: { done: 2 } },
    );
    await waitFor(() => expect(mockCompleteSession).toHaveBeenCalledTimes(1));
    expect(result.current).toBe(false);

    rerender({ done: 1 });
    rerender({ done: 2 });
    await waitFor(() => expect(result.current).toBe(true));
    expect(mockCompleteSession).toHaveBeenCalledTimes(2);
  });

  it("ignores an empty session", () => {
    renderHook(() => useAutoFinalizeSession("c1", 0, 0));
    expect(mockCompleteSession).not.toHaveBeenCalled();
  });
});
