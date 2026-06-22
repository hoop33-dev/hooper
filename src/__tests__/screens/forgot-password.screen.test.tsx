import ForgotPasswordScreen from "@/app/(auth)/forgot-password";
import { sendPasswordResetEmail } from "@/src/services/auth.service";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("@/src/services/auth.service", () => ({
  sendPasswordResetEmail: jest.fn(),
}));

const mockSend = sendPasswordResetEmail as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

const emailField = () => screen.getByPlaceholderText("you@email.com");
const sendButton = () =>
  screen.getByRole("button", { name: "Send reset link" });

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("ForgotPasswordScreen", () => {
  it("requires an email before calling the service", () => {
    render(<ForgotPasswordScreen />);

    fireEvent.press(sendButton());

    expect(screen.getByText("Required")).toBeTruthy();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rejects a malformed email", () => {
    render(<ForgotPasswordScreen />);

    fireEvent.changeText(emailField(), "not-an-email");
    fireEvent.press(sendButton());

    expect(screen.getByText("Enter a valid email")).toBeTruthy();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("shows the success state after sending a reset link", async () => {
    mockSend.mockResolvedValue({ ok: true });

    render(<ForgotPasswordScreen />);
    fireEvent.changeText(emailField(), "user@example.com");
    fireEvent.press(sendButton());

    await waitFor(() => {
      expect(mockSend).toHaveBeenCalledWith("user@example.com");
    });
    expect(await screen.findByText("Reset link sent")).toBeTruthy();
    // Form CTA is swapped for a "back to sign in" action.
    expect(
      screen.getByRole("button", { name: "Back to sign in" }),
    ).toBeTruthy();
  });

  it("trims the email before sending", async () => {
    mockSend.mockResolvedValue({ ok: true });

    render(<ForgotPasswordScreen />);
    fireEvent.changeText(emailField(), "  user@example.com  ");
    fireEvent.press(sendButton());

    await waitFor(() => {
      expect(mockSend).toHaveBeenCalledWith("user@example.com");
    });
  });

  it("surfaces a service error and stays on the form", async () => {
    mockSend.mockResolvedValue({
      ok: false,
      error: "Email rate limit exceeded",
    });

    render(<ForgotPasswordScreen />);
    fireEvent.changeText(emailField(), "user@example.com");
    fireEvent.press(sendButton());

    expect(await screen.findByText("Email rate limit exceeded")).toBeTruthy();
    expect(screen.queryByText("Reset link sent")).toBeNull();
  });
});
