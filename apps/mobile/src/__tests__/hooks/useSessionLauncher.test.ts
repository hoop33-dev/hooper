import { useSessionLauncher } from "@/src/hooks/useSessionLauncher";
import type { ProgramRow } from "@hooper/db";
import { act, renderHook } from "@testing-library/react-native";

const mockPush = jest.fn();
const mockGetInProgress = jest.fn();
const mockStartOrResume = jest.fn();
const mockRestart = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/src/services/sessionCompletion.service", () => ({
  getInProgressCompletion: (...args: unknown[]) => mockGetInProgress(...args),
  startOrResumeSession: (...args: unknown[]) => mockStartOrResume(...args),
  restartSession: (...args: unknown[]) => mockRestart(...args),
}));

const program = { id: "p1", form_id: null } as ProgramRow;
const programWithForm = { id: "p1", form_id: "f1" } as ProgramRow;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetInProgress.mockResolvedValue(null);
  mockStartOrResume.mockResolvedValue(undefined);
  mockRestart.mockResolvedValue(undefined);
});

describe("useSessionLauncher", () => {
  it("runs the launch flow once when start is tapped twice before a re-render", async () => {
    const { result } = renderHook(() =>
      useSessionLauncher("s1", program, false, "athlete1"),
    );
    // Both calls come from the same render, so both see starting=false.
    const { start } = result.current;
    await act(async () => {
      await Promise.all([start(), start()]);
    });
    expect(mockStartOrResume).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it("ignores restart while a start is still in flight", async () => {
    const { result } = renderHook(() =>
      useSessionLauncher("s1", program, false, "athlete1"),
    );
    const { start, restart } = result.current;
    await act(async () => {
      await Promise.all([start(), restart()]);
    });
    expect(mockRestart).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it("can start again once the previous launch has finished", async () => {
    const { result } = renderHook(() =>
      useSessionLauncher("s1", program, false, "athlete1"),
    );
    await act(() => result.current.start());
    await act(() => result.current.start());
    expect(mockPush).toHaveBeenCalledTimes(2);
  });

  it("goes through the check-in when the form has questions", async () => {
    const { result } = renderHook(() =>
      useSessionLauncher("s1", programWithForm, true, "athlete1"),
    );
    await act(() => result.current.start());
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/(app)/training/pre-form" }),
    );
    expect(mockStartOrResume).not.toHaveBeenCalled();
  });

  it("skips straight to the player when the form has no questions", async () => {
    const { result } = renderHook(() =>
      useSessionLauncher("s1", programWithForm, false, "athlete1"),
    );
    await act(() => result.current.start());
    expect(mockStartOrResume).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/(app)/training/play" }),
    );
  });
});
