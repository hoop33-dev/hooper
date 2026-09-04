import { Component, type ErrorInfo, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Body, Button, H2 } from "@/src/components/ui";
import { colors, spacing } from "@/src/constants/theme";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

/**
 * Catches render errors anywhere below it so a single thrown error shows a
 * recoverable fallback instead of an unmounted (white/blank) screen.
 *
 * Must be a class component — React only surfaces render errors through the
 * class error lifecycle (getDerivedStateFromError / componentDidCatch).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface the crash for local debugging. Wire a crash reporter (e.g.
    // Sentry.captureException) in here when one is added.
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <H2 style={styles.title}>Something went wrong</H2>
        <Body style={styles.body}>
          The app hit an unexpected error. You can try again — if it keeps
          happening, restart the app.
        </Body>
        <Button variant="primary" onPress={this.handleReset}>
          Try again
        </Button>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.s6,
    backgroundColor: colors.surface,
  },
  title: {
    textAlign: "center",
    marginBottom: spacing.s3,
  },
  body: {
    textAlign: "center",
    marginBottom: spacing.s6,
  },
});
