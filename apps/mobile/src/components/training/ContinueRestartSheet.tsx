import { Text, View } from "react-native";

import { Button, H3, PopupSheet } from "@/src/components/ui";
import { bodyFont, colors } from "@/src/constants/theme";

type ContinueRestartSheetProps = {
  visible: boolean;
  onContinue: () => void;
  onRestart: () => void;
  onCancel: () => void;
};

/**
 * Shown when the athlete opens a session they've already started: pick up
 * the existing attempt where they left off, or scrap it and start over.
 * Restarting abandons the in-progress attempt (its logged sets are kept for
 * history) — see `restartSession`.
 */
export function ContinueRestartSheet({
  visible,
  onContinue,
  onRestart,
  onCancel,
}: ContinueRestartSheetProps) {
  return (
    <PopupSheet visible={visible} onDismiss={onCancel}>
      <H3 className="mb-2">Pick up where you left off?</H3>
      <Text
        style={{
          fontFamily: bodyFont("400"),
          fontSize: 14,
          lineHeight: 14 * 1.5,
          color: colors.textSecondary,
          marginBottom: 22,
        }}>
        You have an unfinished attempt at this session. Continue it, or restart
        from the beginning.
      </Text>

      <View style={{ gap: 10 }}>
        <Button variant="primary" size="lg" onPress={onContinue}>
          Continue
        </Button>
        <Button
          variant="primary"
          size="lg"
          onPress={onRestart}
          style={{ backgroundColor: colors.danger }}>
          Restart session
        </Button>
        <Button variant="ghost" size="lg" onPress={onCancel}>
          Cancel
        </Button>
      </View>
    </PopupSheet>
  );
}
