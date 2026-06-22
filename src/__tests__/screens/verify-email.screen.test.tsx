import VerifyEmailScreen from "@/app/(auth)/verify-email";
import {
  resendVerificationOtp,
  verifyEmailOtp,
} from "@/src/services/auth.service";
import { useAuthStore } from "@/src/stores/auth.store";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockCanGoBack = jest.fn(() => true);
jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
    back: mockBack,
    canGoBack: mockCanGoBack,
    push: jest.fn(),
  }),
}));

jest.mock("@/src/stores/auth.store", () => ({ useAuthStore: jest.fn() }));

jest.mock("@/src/services/auth.service", () => ({
  verifyEmailOtp: jest.fn(),
  resendVerificationOtp: jest.fn(),
}));

const mockStore = useAuthStore as unknown as jest.Mock;
const mockVerify = verifyEmailOtp as jest.Mock;
const mockResend = resendVerificationOtp as jest.Mock;

const mockSignInComplete = jest.fn();
const mockSignOut = jest.fn();

function setStore(overrides: Record<string, unknown> = {}) {
  mockStore.mockReturnValue({
    pendingVerificationEmail: "jordan@example.com",
    pendingVerificationRole: "player",
    status: "needs_verification",
    profile: null,
    signInComplete: mockSignInComplete,
    signOut: mockSignOut,
    ...overrides,
  });
}

// The 6 OTP boxes are the only TextInputs and all start empty; the first one
// accepts a full-code paste, which the screen splits across the boxes.
const firstOtpBox = () => screen.getAllByDisplayValue("")[0];

beforeEach(() => {
  jest.clearAllMocks();
  setStore();
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("VerifyEmailScreen", () => {
  it("shows the masked destination email", () => {
    render(<VerifyEmailScreen />);
    expect(screen.getByText("jo···@example.com")).toBeTruthy();
  });

  it("redirects home when there is no pending email to verify", () => {
    setStore({ pendingVerificationEmail: null });

    render(<VerifyEmailScreen />);

    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("verifies the entered code and shows the success state", async () => {
    const session = { user: { id: "u1" } };
    mockVerify.mockResolvedValue({ ok: true, session });

    render(<VerifyEmailScreen />);
    fireEvent.changeText(firstOtpBox(), "123456");

    await waitFor(() => {
      expect(mockVerify).toHaveBeenCalledWith("jordan@example.com", "123456");
    });
    expect(await screen.findByText("Email verified")).toBeTruthy();

    fireEvent.press(screen.getByText("Continue to Hooper"));
    await waitFor(() => {
      expect(mockSignInComplete).toHaveBeenCalledWith(session);
    });
  });

  it("shows an error and stays on the form for an invalid code", async () => {
    mockVerify.mockResolvedValue({ ok: false, error: "Invalid code." });

    render(<VerifyEmailScreen />);
    fireEvent.changeText(firstOtpBox(), "000000");

    expect(
      await screen.findByText("Incorrect code — please try again"),
    ).toBeTruthy();
    expect(screen.queryByText("Email verified")).toBeNull();
  });

  it("resends a fresh code and confirms it was sent", async () => {
    mockResend.mockResolvedValue({ ok: true });

    render(<VerifyEmailScreen />);
    fireEvent.press(screen.getByText("Resend code"));

    await waitFor(() => {
      expect(mockResend).toHaveBeenCalledWith("jordan@example.com");
    });
    expect(
      await screen.findByText("Code resent — check your inbox"),
    ).toBeTruthy();
  });
});
