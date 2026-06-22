// Global Jest setup for component/screen tests.
// Native modules that have no JS implementation under jest-expo are mocked here
// so screens can render in the test environment.

// react-native-keyboard-controller ships a ready-made mock that swaps its
// native-backed views (KeyboardAwareScrollView, KeyboardStickyView) for plain
// RN views.
jest.mock("react-native-keyboard-controller", () =>
  require("react-native-keyboard-controller/jest"),
);

// react-native-safe-area-context ships a mock that renders providers/consumers
// with static insets instead of reading from the native layer.
jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
);
