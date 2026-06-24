import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Title } from "@/src/components/ui/Typography";
import { colors, fonts } from "@/src/constants/theme";

type DiscardChangesModalProps = {
  visible: boolean;
  accent: string;
  onDiscard: () => void;
  onKeepEditing: () => void;
};

/** Confirmation shown when leaving the screen with unsaved edits. */
export function DiscardChangesModal({
  visible,
  accent,
  onDiscard,
  onKeepEditing,
}: DiscardChangesModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onKeepEditing}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Title className="mb-2">Discard changes?</Title>
          <Text style={styles.body}>
            You have unsaved changes. If you leave now, they&apos;ll be lost.
          </Text>

          <Pressable
            onPress={onDiscard}
            accessibilityRole="button"
            style={styles.discard}>
            <Text style={styles.discardLabel}>Discard changes</Text>
          </Pressable>
          <Pressable
            onPress={onKeepEditing}
            accessibilityRole="button"
            style={[styles.keep, { borderColor: `${accent}40` }]}>
            <Text style={styles.keepLabel}>Keep editing</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 24,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 14 * 1.5,
    color: colors.textSecondary,
    marginBottom: 22,
  },
  discard: {
    height: 50,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.danger,
    marginBottom: 10,
  },
  discardLabel: {
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  keep: {
    height: 50,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface2,
    borderWidth: 1,
  },
  keepLabel: {
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});
