import { Text, View } from "react-native";

import { bodyFont, colors } from "@/src/constants/theme";

import { Button } from "./Button";
import { PopupSheet } from "./PopupSheet";
import { H3 } from "./Typography";

type ExitGuardSheetProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Accent for the confirm button (e.g. brand orange, or danger for a destructive discard). */
  confirmAccent?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Shared confirmation popup for `useExitGuard` screens — leaving a session
 * mid-workout, discarding unsaved profile edits, etc. Slides up from the
 * bottom over a fading backdrop; see `PopupSheet`. Buttons reuse the same
 * `Button` component as the rest of the app (Next block/Prev, Login, etc.)
 * rather than the fully-rounded `AccentButton`, so a popup's buttons match
 * every other button's corner radius.
 */
export function ExitGuardSheet({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  confirmAccent = colors.brandOrange,
  onConfirm,
  onCancel,
}: ExitGuardSheetProps) {
  return (
    <PopupSheet visible={visible} onDismiss={onCancel}>
      <H3 className="mb-2">{title}</H3>
      <Text
        style={{
          fontFamily: bodyFont("400"),
          fontSize: 14,
          lineHeight: 14 * 1.5,
          color: colors.textSecondary,
          marginBottom: 22,
        }}>
        {message}
      </Text>

      <View style={{ gap: 10 }}>
        <Button
          variant="primary"
          size="lg"
          onPress={onConfirm}
          style={{ backgroundColor: confirmAccent }}>
          {confirmLabel}
        </Button>
        <Button variant="ghost" size="lg" onPress={onCancel}>
          {cancelLabel}
        </Button>
      </View>
    </PopupSheet>
  );
}
