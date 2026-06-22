import SignupDetailsScreen from "@/app/(auth)/signup-details";
import { signUp } from "@/src/services/auth.service";
import { useAuthStore } from "@/src/stores/auth.store";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockParams = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: jest.fn() }),
  useLocalSearchParams: () => mockParams(),
}));

jest.mock("@/src/stores/auth.store", () => ({ useAuthStore: jest.fn() }));

jest.mock("@/src/services/auth.service", () => ({ signUp: jest.fn() }));

const mockStore = useAuthStore as unknown as jest.Mock;
const mockSignUp = signUp as jest.Mock;
const mockSetVerificationPending = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockParams.mockReturnValue({ role: "parent" });
  mockStore.mockReturnValue({
    setVerificationPending: mockSetVerificationPending,
  });
});

const submit = () => fireEvent.press(screen.getByText("Create account"));

// Fills everything a non-player (parent) sign-up needs to pass validation.
function fillValidParentForm() {
  fireEvent.changeText(screen.getByTestId("input-firstName"), "Jane");
  fireEvent.changeText(screen.getByTestId("input-lastName"), "Doe");
  fireEvent.changeText(screen.getByTestId("input-email"), "jane@example.com");
  fireEvent.changeText(screen.getByTestId("input-username"), "janedoe");
  fireEvent.changeText(screen.getByPlaceholderText("21 000 0000"), "211234567");

  // Region select: open the sheet and pick an option.
  fireEvent.press(screen.getByText("Select your region"));
  fireEvent.press(screen.getByText("Auckland"));

  fireEvent.changeText(
    screen.getByPlaceholderText("8+ characters"),
    "Password1!",
  );
  fireEvent.changeText(
    screen.getByPlaceholderText("Repeat your password"),
    "Password1!",
  );

  // Disclosure checkbox — pressing the label bubbles to the checkbox.
  fireEvent.press(screen.getByText(/I agree to Hooper/));
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("SignupDetailsScreen", () => {
  it("reflects the chosen role in the subtitle", () => {
    mockParams.mockReturnValue({ role: "coach" });
    render(<SignupDetailsScreen />);
    expect(screen.getByText("Coach")).toBeTruthy();
  });

  it("asks players for a date of birth but not parents", () => {
    mockParams.mockReturnValue({ role: "player" });
    const { rerender } = render(<SignupDetailsScreen />);
    expect(screen.getByText("Date of birth")).toBeTruthy();

    mockParams.mockReturnValue({ role: "parent" });
    rerender(<SignupDetailsScreen />);
    expect(screen.queryByText("Date of birth")).toBeNull();
  });

  it("blocks submission and surfaces validation errors when empty", () => {
    render(<SignupDetailsScreen />);

    submit();

    // Empty required fields (incl. password) all surface "Required".
    expect(screen.getAllByText("Required").length).toBeGreaterThan(0);
    // The region placeholder and its validation error share the same copy.
    expect(screen.getAllByText("Select your region").length).toBeGreaterThan(1);
    expect(
      screen.getByText("You must acknowledge the disclosure"),
    ).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("submits a valid form and routes to verify-email", async () => {
    mockSignUp.mockResolvedValue({ ok: true });

    render(<SignupDetailsScreen />);
    fillValidParentForm();
    submit();

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: "Jane",
          lastName: "Doe",
          username: "janedoe",
          email: "jane@example.com",
          regionSlug: "auckland",
          role: "parent",
          password: "Password1!",
        }),
      );
    });
    expect(mockSetVerificationPending).toHaveBeenCalledWith(
      "jane@example.com",
      "parent",
    );
    expect(mockPush).toHaveBeenCalledWith("/(auth)/verify-email");
  });

  it("maps a username-taken error to the username field and does not navigate", async () => {
    mockSignUp.mockResolvedValue({
      ok: false,
      field: "username",
      error: "That username is already taken.",
    });

    render(<SignupDetailsScreen />);
    fillValidParentForm();
    submit();

    expect(
      await screen.findByText("That username is already taken."),
    ).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
