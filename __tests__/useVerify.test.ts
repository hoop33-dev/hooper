import { renderHook, act } from "@testing-library/react-native";

import { useVerify } from "@/src/hooks/useVerify";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockReplace = jest.fn();
const mockVerifyOtp = jest.fn();
const mockResendOtp = jest.fn();
const mockCreateProfile = jest.fn();

const mockTestEmail = "jamal@example.com";
const mockTestProfileData = JSON.stringify({
  firstName: "Jamal",
  lastName: "Murray",
  dateOfBirth: "2000-01-01T00:00:00.000Z",
  phone: "+6421000000",
  region: "auckland",
  parentName: null,
  parentEmail: null,
  parentPhone: null,
});

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => ({
    email: mockTestEmail,
    profileData: mockTestProfileData,
  }),
}));

jest.mock("@/src/services/auth.service", () => ({
  verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
  resendOtp: (...args: unknown[]) => mockResendOtp(...args),
  createProfile: (...args: unknown[]) => mockCreateProfile(...args),
}));

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("useVerify", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockVerifyOtp.mockResolvedValue({
      data: { user: { id: "uid-1" }, session: null },
      error: null,
    });
    mockResendOtp.mockResolvedValue({ data: {}, error: null });
    mockCreateProfile.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("initial state", () => {
    test("code starts empty", () => {
      const { result } = renderHook(() => useVerify());
      expect(result.current.code).toBe("");
    });

    test("loading starts false", () => {
      const { result } = renderHook(() => useVerify());
      expect(result.current.loading).toBe(false);
    });

    test("authError starts null", () => {
      const { result } = renderHook(() => useVerify());
      expect(result.current.authError).toBeNull();
    });

    test("cooldown starts at 0", () => {
      const { result } = renderHook(() => useVerify());
      expect(result.current.cooldown).toBe(0);
    });

    test("exposes the email param", () => {
      const { result } = renderHook(() => useVerify());
      expect(result.current.email).toBe(mockTestEmail);
    });
  });

  describe("handleVerify", () => {
    test("does nothing when code length < 6", async () => {
      const { result } = renderHook(() => useVerify());
      act(() => result.current.setCode("12345"));
      await act(async () => {
        await result.current.handleVerify();
      });
      expect(mockVerifyOtp).not.toHaveBeenCalled();
    });

    test("calls verifyOtp with email and code", async () => {
      const { result } = renderHook(() => useVerify());
      act(() => result.current.setCode("123456"));
      await act(async () => {
        await result.current.handleVerify();
      });
      expect(mockVerifyOtp).toHaveBeenCalledWith(mockTestEmail, "123456");
    });

    test("calls createProfile with correct fields after successful verify", async () => {
      const { result } = renderHook(() => useVerify());
      act(() => result.current.setCode("123456"));
      await act(async () => {
        await result.current.handleVerify();
      });
      expect(mockCreateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "uid-1",
          first_name: "Jamal",
          last_name: "Murray",
          date_of_birth: "2000-01-01",
          region: "auckland",
        }),
      );
    });

    test("navigates to /(app) after successful verify", async () => {
      const { result } = renderHook(() => useVerify());
      act(() => result.current.setCode("123456"));
      await act(async () => {
        await result.current.handleVerify();
      });
      expect(mockReplace).toHaveBeenCalledWith("/(app)");
    });

    test("sets authError when verifyOtp fails", async () => {
      mockVerifyOtp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: "Token has expired" },
      });
      const { result } = renderHook(() => useVerify());
      act(() => result.current.setCode("123456"));
      await act(async () => {
        await result.current.handleVerify();
      });
      expect(result.current.authError).toBe("Token has expired");
      expect(mockReplace).not.toHaveBeenCalled();
    });

    test("does not call createProfile when verifyOtp fails", async () => {
      mockVerifyOtp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: "Invalid token" },
      });
      const { result } = renderHook(() => useVerify());
      act(() => result.current.setCode("123456"));
      await act(async () => {
        await result.current.handleVerify();
      });
      expect(mockCreateProfile).not.toHaveBeenCalled();
    });
  });

  describe("handleResend", () => {
    test("calls resendOtp with the email", async () => {
      const { result } = renderHook(() => useVerify());
      await act(async () => {
        await result.current.handleResend();
      });
      expect(mockResendOtp).toHaveBeenCalledWith(mockTestEmail);
    });

    test("sets cooldown to 30 after resend", async () => {
      const { result } = renderHook(() => useVerify());
      await act(async () => {
        await result.current.handleResend();
      });
      expect(result.current.cooldown).toBe(30);
    });

    test("does not call resendOtp during cooldown", async () => {
      const { result } = renderHook(() => useVerify());
      await act(async () => {
        await result.current.handleResend();
      });
      mockResendOtp.mockClear();
      await act(async () => {
        await result.current.handleResend();
      });
      expect(mockResendOtp).not.toHaveBeenCalled();
    });

    test("cooldown decrements over time", async () => {
      const { result } = renderHook(() => useVerify());
      await act(async () => {
        await result.current.handleResend();
      });
      expect(result.current.cooldown).toBe(30);
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(result.current.cooldown).toBe(25);
    });

    test("cooldown reaches 0 after 30 seconds", async () => {
      const { result } = renderHook(() => useVerify());
      await act(async () => {
        await result.current.handleResend();
      });
      act(() => {
        jest.advanceTimersByTime(30000);
      });
      expect(result.current.cooldown).toBe(0);
    });
  });
});
