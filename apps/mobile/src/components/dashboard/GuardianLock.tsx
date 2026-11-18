import { Modal, Pressable, Text, View } from "react-native";

import { Title } from "@/src/components/ui/Typography";
import { bodyFont, colors } from "@/src/constants/theme";
import { LockIcon } from "./icons";

/** The guardian's colour, used on the locks a managed athlete sees. */
const PARENT_ACCENT = "#F68D68";

type LockKind = "profile" | "billing";

function GotItButton({ onClose }: { onClose: () => void }) {
  return (
    <Pressable
      onPress={onClose}
      accessibilityRole="button"
      style={{
        width: "100%",
        height: 46,
        backgroundColor: PARENT_ACCENT,
        borderRadius: 9999,
        alignItems: "center",
        justifyContent: "center",
      }}>
      <Text
        style={{
          fontFamily: bodyFont("700"),
          fontSize: 14.5,
          color: "#fff",
        }}>
        Got it
      </Text>
    </Pressable>
  );
}

function LockCard({ kind, onClose }: { kind: LockKind; onClose: () => void }) {
  return (
    <Pressable
      onPress={(e) => e.stopPropagation()}
      style={{
        width: "100%",
        maxWidth: 300,
        backgroundColor: colors.surface2,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        borderRadius: 22,
        paddingTop: 26,
        paddingHorizontal: 22,
        paddingBottom: 20,
        alignItems: "center",
      }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          marginBottom: 16,
          backgroundColor: "rgba(246,141,104,0.14)",
          borderWidth: 1,
          borderColor: "rgba(246,141,104,0.32)",
          alignItems: "center",
          justifyContent: "center",
        }}>
        <LockIcon size={24} color={PARENT_ACCENT} />
      </View>
      <Title className="mb-2 text-center">
        {kind === "billing" ? "Membership is locked" : "Settings are locked"}
      </Title>
      <Text
        style={{
          fontFamily: bodyFont("400"),
          fontSize: 13.5,
          color: colors.textSecondary,
          lineHeight: 20,
          marginBottom: 22,
          textAlign: "center",
        }}>
        Your guardian manages your{" "}
        {kind === "billing" ? "membership and billing" : "profile settings"}.
        Ask them to make changes for you.
      </Text>
      <GotItButton onClose={onClose} />
    </Pressable>
  );
}

/**
 * Centered popup explaining that the child's guardian manages this area.
 * Shown when a locked child taps a disabled control.
 */
export function GuardianLockPopup({
  visible,
  onClose,
  kind = "profile",
}: {
  visible: boolean;
  onClose: () => void;
  kind?: LockKind;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(8,6,6,0.62)",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
        }}>
        <LockCard kind={kind} onClose={onClose} />
      </Pressable>
    </Modal>
  );
}
