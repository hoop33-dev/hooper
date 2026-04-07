import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react-native";
import VerifyScreen from "../app/(auth)/verify";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockVerifyOtp = jest.fn();
const mockResendOtp = jest.fn();
const mockCreateProfile = jest.fn();

// Prefix with "mock" so they're accessible inside jest.mock factories
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
  useRouter: () => ({ replace: mockReplace, back: mockBack }),
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

describe("VerifyScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyOtp.mockResolvedValue({
      data: { user: { id: "uid-1" }, session: null },
      error: null,
    });
    mockResendOtp.mockResolvedValue({ data: {}, error: null });
    mockCreateProfile.mockResolvedValue({ data: null, error: null });
  });

  describe("rendering", () => {
    test("renders the VERIFY YOUR heading", () => {
      render(<VerifyScreen />);
      expect(screen.getByText("VERIFY YOUR")).toBeTruthy();
      expect(screen.getByText("ACCOUNT")).toBeTruthy();
    });

    test("renders the email address in description", () => {
      render(<VerifyScreen />);
      expect(screen.getByText(mockTestEmail)).toBeTruthy();
    });

    test("renders the VERIFY button", () => {
      render(<VerifyScreen />);
      expect(screen.getByText("VERIFY")).toBeTruthy();
    });

    test("renders the Resend link", () => {
      render(<VerifyScreen />);
      expect(screen.getByText("Resend")).toBeTruthy();
    });
  });

  describe("VERIFY button state", () => {
    test("VERIFY button is disabled when code is empty", () => {
      render(<VerifyScreen />);
      fireEvent.press(screen.getByText("VERIFY"));
      expect(mockVerifyOtp).not.toHaveBeenCalled();
    });

    test("VERIFY button is disabled when code has fewer than 6 digits", () => {
      render(<VerifyScreen />);
      fireEvent.changeText(screen.getByPlaceholderText("000000"), "12345");
      fireEvent.press(screen.getByText("VERIFY"));
      expect(mockVerifyOtp).not.toHaveBeenCalled();
    });
  });

  describe("success flow", () => {
    test("calls verifyOtp with email and 6-digit code", async () => {
      render(<VerifyScreen />);
      fireEvent.changeText(screen.getByPlaceholderText("000000"), "123456");
      await act(async () => {
        fireEvent.press(screen.getByText("VERIFY"));
      });
      expect(mockVerifyOtp).toHaveBeenCalledWith(mockTestEmail, "123456");
    });

    test("calls createProfile after successful verification", async () => {
      render(<VerifyScreen />);
      fireEvent.changeText(screen.getByPlaceholderText("000000"), "123456");
      await act(async () => {
        fireEvent.press(screen.getByText("VERIFY"));
      });
      expect(mockCreateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "uid-1",
          first_name: "Jamal",
          last_name: "Murray",
          region: "auckland",
        }),
      );
    });

    test("navigates to app home after successful verification", async () => {
      render(<VerifyScreen />);
      fireEvent.changeText(screen.getByPlaceholderText("000000"), "123456");
      await act(async () => {
        fireEvent.press(screen.getByText("VERIFY"));
      });
      expect(mockReplace).toHaveBeenCalledWith("/(app)");
    });
  });

  describe("error flow", () => {
    test("displays auth error when verifyOtp returns an error", async () => {
      mockVerifyOtp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: "Invalid OTP code" },
      });
      render(<VerifyScreen />);
      fireEvent.changeText(screen.getByPlaceholderText("000000"), "000000");
      await act(async () => {
        fireEvent.press(screen.getByText("VERIFY"));
      });
      expect(screen.getByText("Invalid OTP code")).toBeTruthy();
    });

    test("does not navigate to app when verifyOtp fails", async () => {
      mockVerifyOtp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: "Expired token" },
      });
      render(<VerifyScreen />);
      fireEvent.changeText(screen.getByPlaceholderText("000000"), "000000");
      await act(async () => {
        fireEvent.press(screen.getByText("VERIFY"));
      });
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe("resend", () => {
    test("calls resendOtp when Resend is pressed", async () => {
      render(<VerifyScreen />);
      await act(async () => {
        fireEvent.press(screen.getByText("Resend"));
      });
      expect(mockResendOtp).toHaveBeenCalledWith(mockTestEmail);
    });

    test("shows countdown after resend", async () => {
      render(<VerifyScreen />);
      await act(async () => {
        fireEvent.press(screen.getByText("Resend"));
      });
      expect(screen.getByText(/Resend code in \d+s/)).toBeTruthy();
    });

    test("hides the Resend link during cooldown", async () => {
      render(<VerifyScreen />);
      await act(async () => {
        fireEvent.press(screen.getByText("Resend"));
      });
      expect(screen.queryByText("Resend")).toBeNull();
    });
  });

  describe("navigation", () => {
    test("back button calls router.back()", () => {
      render(<VerifyScreen />);
      fireEvent.press(screen.getByLabelText("Go back"));
      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });
});
