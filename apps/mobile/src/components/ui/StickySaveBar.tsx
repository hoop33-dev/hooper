import { type ReactNode } from "react";
import { View } from "react-native";

import { colors } from "@/src/constants/theme";

import { ErrorBanner } from "./ErrorBanner";

type StickySaveBarProps = {
  /** Optional error shown above the action. */
  error?: string | null;
  /** The action button (e.g. an AccentButton). */
  children: ReactNode;
};

export function StickySaveBar({ error, children }: StickySaveBarProps) {
  return (
    <View
      pointerEvents="box-none"
      className="absolute right-0 bottom-0 left-0 px-5 pt-3 pb-9"
      style={{ backgroundColor: colors.surface }}>
      {error ? (
        <View className="mb-2.5">
          <ErrorBanner message={error} />
        </View>
      ) : null}
      {children}
    </View>
  );
}
