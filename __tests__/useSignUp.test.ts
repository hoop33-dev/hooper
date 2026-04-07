import { renderHook, act } from "@testing-library/react-native";

import { useSignUp } from "@/src/hooks/useSignUp";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPush = jest.fn();
const mockSignUpWithEmail = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mocking the service prevents supabase/AsyncStorage from loading
jest.mock("@/src/services/auth.service", () => ({
  signUpWithEmail: (...args: unknown[]) => mockSignUpWithEmail(...args),
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

function adultDOB(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d;
}

function minorDOB(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 14);
  return d;
}

function fillAdultForm(result: ReturnType<typeof useSignUp>) {
  act(() => {
    result.setFirstName("Jamal");
    result.setLastName("Murray");
    result.setDateOfBirth(adultDOB());
    result.setEmail("jamal@example.com");
    result.setPhone("21000000");
    result.setRegion("auckland");
    result.setPassword("Password1");
    result.setConfirmPassword("Password1");
    result.setAgreedToTerms(true);
  });
}

function fillMinorForm(result: ReturnType<typeof useSignUp>) {
  act(() => {
    result.setFirstName("Junior");
    result.setLastName("Player");
    result.setDateOfBirth(minorDOB());
    result.setParentName("Parent Name");
    result.setParentEmail("parent@example.com");
    result.setParentPhone("21000000");
    result.setRegion("auckland");
    result.setPassword("Password1");
    result.setConfirmPassword("Password1");
    result.setAgreedToTerms(true);
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("useSignUp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignUpWithEmail.mockResolvedValue({
      data: { user: { id: "uid-1" }, session: null },
      error: null,
    });
  });

  describe("isMinor", () => {
    test("isMinor is false when no DOB is set", () => {
      const { result } = renderHook(() => useSignUp());
      expect(result.current.isMinor).toBe(false);
    });

    test("isMinor is true for age < 16", () => {
      const { result } = renderHook(() => useSignUp());
      act(() => result.current.setDateOfBirth(minorDOB()));
      expect(result.current.isMinor).toBe(true);
    });

    test("isMinor is false for age >= 18", () => {
      const { result } = renderHook(() => useSignUp());
      act(() => result.current.setDateOfBirth(adultDOB()));
      expect(result.current.isMinor).toBe(false);
    });

    test("isMinor is false for exactly age 16", () => {
      const { result } = renderHook(() => useSignUp());
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 16);
      act(() => result.current.setDateOfBirth(dob));
      expect(result.current.isMinor).toBe(false);
    });
  });

  describe("validation — adult path", () => {
    test("no errors when all adult fields are valid", async () => {
      const { result } = renderHook(() => useSignUp());
      fillAdultForm(result.current);
      await act(async () => {
        await result.current.handleSubmit();
      });
      expect(result.current.errors).toEqual({});
    });

    test("requires firstName", async () => {
      const { result } = renderHook(() => useSignUp());
      fillAdultForm(result.current);
      act(() => result.current.setFirstName(""));
      await act(async () => {
        await result.current.handleSubmit();
      });
      expect(result.current.errors.firstName).toBeDefined();
    });

    test("requires lastName", async () => {
      const { result } = renderHook(() => useSignUp());
      fillAdultForm(result.current);
      act(() => result.current.setLastName(""));
      await act(async () => {
        await result.current.handleSubmit();
      });
      expect(result.current.errors.lastName).toBeDefined();
    });

    test("requires dateOfBirth", async () => {
      const { result } = renderHook(() => useSignUp());
      fillAdultForm(result.current);
      act(() => result.current.setDateOfBirth(undefined));
      await act(async () => {
        await result.current.handleSubmit();
      });
      expect(result.current.errors.dateOfBirth).toBeDefined();
    });

    test("requires valid email", async () => {
      const { result } = renderHook(() => useSignUp());
      fillAdultForm(result.current);
      act(() => result.current.setEmail("not-an-email"));
      await act(async () => {
        await result.current.handleSubmit();
      });
      expect(result.current.errors.email).toBeDefined();
    });

    test("requires region", async () => {
      const { result } = renderHook(() => useSignUp());
      fillAdultForm(result.current);
      act(() => result.current.setRegion(""));
      await act(async () => {
        await result.current.handleSubmit();
      });
      expect(result.current.errors.region).toBeDefined();
    });

    test("requires password min 8 chars", async () => {
      const { result } = renderHook(() => useSignUp());
      fillAdultForm(result.current);
      act(() => {
        result.current.setPassword("Short1");
        result.current.setConfirmPassword("Short1");
      });
      await act(async () => {
        await result.current.handleSubmit();
      });
      expect(result.current.errors.password).toBeDefined();
    });

    test("requires password to have an uppercase letter", async () => {
      const { result } = renderHook(() => useSignUp());
      fillAdultForm(result.current);
      act(() => {
        result.current.setPassword("password1");
        result.current.setConfirmPassword("password1");
      });
      await act(async () => {
        await result.current.handleSubmit();
      });
      expect(result.current.errors.password).toBeDefined();
    });

    test("requires password to have a number", async () => {
      const { result } = renderHook(() => useSignUp());
      fillAdultForm(result.current);
      act(() => {
        result.current.setPassword("PasswordOnly");
        result.current.setConfirmPassword("PasswordOnly");
      });
      await act(async () => {
        await result.current.handleSubmit();
      });
      expect(result.current.errors.password).toBeDefined();
    });

    test("requires passwords to match", async () => {
      const { result } = renderHook(() => useSignUp());
      fillAdultForm(result.current);
      act(() => result.current.setConfirmPassword("Different1"));
      await act(async () => {
        await result.current.handleSubmit();
      });
      expect(result.current.errors.confirmPassword).toBeDefined();
    });

    test("requires terms agreement", async () => {
      const { result } = renderHook(() => useSignUp());
      fillAdultForm(result.current);
      act(() => result.current.setAgreedToTerms(false));
      await act(async () => {
        await result.current.handleSubmit();
      });
      expect(result.current.errors.agreedToTerms).toBeDefined();
    });
  });

  describe("validation — minor path", () => {
    test("no errors when all minor fields are valid", async () => {
      const { result } = renderHook(() => useSignUp());
      fillMinorForm(result.current);
      await act(async () => {
        await result.current.handleSubmit();
      });
      expect(result.current.errors).toEqual({});
    });

    test("requires parentName for minors", async () => {
      const { result } = renderHook(() => useSignUp());
      fillMinorForm(result.current);
      act(() => result.current.setParentName(""));
      await act(async () => {
        await result.current.handleSubmit();
      });
      expect(result.current.errors.parentName).toBeDefined();
    });

    test("requires valid parentEmail for minors", async () => {
      const { result } = renderHook(() => useSignUp());
      fillMinorForm(result.current);
      act(() => result.current.setParentEmail("bad-email"));
      await act(async () => {
        await result.current.handleSubmit();
      });
      expect(result.current.errors.parentEmail).toBeDefined();
    });

    test("requires parentPhone for minors", async () => {
      const { result } = renderHook(() => useSignUp());
      fillMinorForm(result.current);
      act(() => result.current.setParentPhone(""));
      await act(async () => {
        await result.current.handleSubmit();
      });
      expect(result.current.errors.parentPhone).toBeDefined();
    });

    test("does not require email/phone for minors", async () => {
      const { result } = renderHook(() => useSignUp());
      fillMinorForm(result.current);
      await act(async () => {
        await result.current.handleSubmit();
      });
      expect(result.current.errors.email).toBeUndefined();
      expect(result.current.errors.phone).toBeUndefined();
    });
  });

  describe("submit flow", () => {
    test("calls signUpWithEmail with adult email", async () => {
      const { result } = renderHook(() => useSignUp());
      fillAdultForm(result.current);
      await act(async () => {
        await result.current.handleSubmit();
      });
      expect(mockSignUpWithEmail).toHaveBeenCalledWith(
        expect.objectContaining({ email: "jamal@example.com" }),
      );
    });

    test("uses parentEmail as authEmail for minors", async () => {
      const { result } = renderHook(() => useSignUp());
      fillMinorForm(result.current);
      await act(async () => {
        await result.current.handleSubmit();
      });
      expect(mockSignUpWithEmail).toHaveBeenCalledWith(
        expect.objectContaining({ email: "parent@example.com" }),
      );
    });

    test("navigates to verify screen on successful signup", async () => {
      const { result } = renderHook(() => useSignUp());
      fillAdultForm(result.current);
      await act(async () => {
        await result.current.handleSubmit();
      });
      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: "/(auth)/verify",
          params: expect.objectContaining({ email: "jamal@example.com" }),
        }),
      );
    });

    test("sets authError when signUpWithEmail returns an error", async () => {
      mockSignUpWithEmail.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: "Email already registered" },
      });
      const { result } = renderHook(() => useSignUp());
      fillAdultForm(result.current);
      await act(async () => {
        await result.current.handleSubmit();
      });
      expect(result.current.authError).toBe("Email already registered");
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
