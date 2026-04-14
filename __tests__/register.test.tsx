import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import RegisterScreen from "../app/(auth)/register";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockOpenURL = jest.fn();
const mockHandleSubmit = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

jest.mock("expo-linking", () => ({
  openURL: (url: string) => mockOpenURL(url),
}));

jest.mock("@react-native-community/datetimepicker", () => "DateTimePicker");

// Mock the hook — screen tests only verify rendering and wiring, not logic
const mockHookState = {
  firstName: "",
  lastName: "",
  dateOfBirth: undefined as Date | undefined,
  email: "",
  phone: "",
  region: "",
  password: "",
  confirmPassword: "",
  showPassword: false,
  showConfirmPassword: false,
  agreedToTerms: false,
  setFirstName: jest.fn(),
  setLastName: jest.fn(),
  setDateOfBirth: jest.fn(),
  setEmail: jest.fn(),
  setPhone: jest.fn(),
  setRegion: jest.fn(),
  setPassword: jest.fn(),
  setConfirmPassword: jest.fn(),
  setShowPassword: jest.fn(),
  setShowConfirmPassword: jest.fn(),
  setAgreedToTerms: jest.fn(),
  errors: {} as Record<string, string>,
  authError: null as string | null,
  loading: false,
  handleSubmit: mockHandleSubmit,
};

jest.mock("@/src/hooks/useSignUp", () => ({
  useSignUp: () => mockHookState,
}));

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("RegisterScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(mockHookState, {
      firstName: "",
      lastName: "",
      dateOfBirth: undefined,
      email: "",
      phone: "",
      region: "",
      password: "",
      confirmPassword: "",
      showPassword: false,
      showConfirmPassword: false,
      agreedToTerms: false,
      errors: {},
      authError: null,
      loading: false,
    });
  });

  describe("rendering", () => {
    test("renders headline text", () => {
      render(<RegisterScreen />);
      expect(screen.getByText("CREATE YOUR")).toBeTruthy();
      expect(screen.getByText("LEGACY")).toBeTruthy();
    });

    test("renders the CREATE ACCOUNT button", () => {
      render(<RegisterScreen />);
      expect(screen.getByText("CREATE ACCOUNT")).toBeTruthy();
    });

    test("renders the sign in footer", () => {
      render(<RegisterScreen />);
      expect(screen.getByText("Already have an account?")).toBeTruthy();
      expect(screen.getByText("Sign In")).toBeTruthy();
    });

    test("renders Terms of Service and Privacy Policy links", () => {
      render(<RegisterScreen />);
      expect(screen.getByText("Terms of Service")).toBeTruthy();
      expect(screen.getByText("Privacy Policy")).toBeTruthy();
    });
  });

  describe("form fields", () => {
    test("renders email and phone fields", () => {
      render(<RegisterScreen />);
      expect(screen.getByPlaceholderText("john.doe@example.com")).toBeTruthy();
      expect(
        screen.getAllByPlaceholderText("021 234 5678").length,
      ).toBeGreaterThan(0);
    });

    test("renders name and password fields", () => {
      render(<RegisterScreen />);
      expect(screen.getByPlaceholderText("John")).toBeTruthy();
      expect(screen.getByPlaceholderText("Doe")).toBeTruthy();
    });
  });

  describe("validation errors", () => {
    test("displays field-level error messages", () => {
      mockHookState.errors = {
        firstName: "First name is required",
        email: "Enter a valid email address",
        password: "Password must be at least 8 characters",
        confirmPassword: "Passwords do not match",
      };
      render(<RegisterScreen />);
      expect(screen.getByText("First name is required")).toBeTruthy();
      expect(screen.getByText("Enter a valid email address")).toBeTruthy();
      expect(
        screen.getByText("Password must be at least 8 characters"),
      ).toBeTruthy();
      expect(screen.getByText("Passwords do not match")).toBeTruthy();
    });

    test("displays terms agreement error", () => {
      mockHookState.errors = {
        agreedToTerms:
          "You must agree to the Terms of Service and Privacy Policy",
      };
      render(<RegisterScreen />);
      expect(
        screen.getByText(
          "You must agree to the Terms of Service and Privacy Policy",
        ),
      ).toBeTruthy();
    });
  });

  describe("auth error", () => {
    test("displays auth error from Supabase", () => {
      mockHookState.authError = "This email is already registered.";
      render(<RegisterScreen />);
      expect(
        screen.getByText("This email is already registered."),
      ).toBeTruthy();
    });
  });

  describe("submit", () => {
    test("calls handleSubmit when CREATE ACCOUNT is pressed", () => {
      render(<RegisterScreen />);
      fireEvent.press(screen.getByText("CREATE ACCOUNT"));
      expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
    });

    test("disables the button while loading", () => {
      mockHookState.loading = true;
      render(<RegisterScreen />);
      fireEvent.press(screen.getByText("CREATE ACCOUNT"));
      expect(mockHandleSubmit).not.toHaveBeenCalled();
    });
  });

  describe("navigation", () => {
    test("Sign In link navigates to login screen", () => {
      render(<RegisterScreen />);
      fireEvent.press(screen.getByText("Sign In"));
      expect(mockPush).toHaveBeenCalledWith("/(auth)/login");
    });

    test("back button calls router.back()", () => {
      render(<RegisterScreen />);
      fireEvent.press(screen.getByLabelText("Go back"));
      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });

  describe("external links", () => {
    test("Terms of Service link opens the correct URL", () => {
      render(<RegisterScreen />);
      fireEvent.press(screen.getByText("Terms of Service"));
      expect(mockOpenURL).toHaveBeenCalledWith(
        "https://www.hoop33.co.nz/terms",
      );
    });

    test("Privacy Policy link opens the correct URL", () => {
      render(<RegisterScreen />);
      fireEvent.press(screen.getByText("Privacy Policy"));
      expect(mockOpenURL).toHaveBeenCalledWith(
        "https://www.hoop33.co.nz/privacypolicy",
      );
    });
  });
});
