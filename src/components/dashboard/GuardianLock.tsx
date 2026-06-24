import { Modal, Pressable, Text, View } from "react-native";

import { colors, fonts } from "@/src/constants/theme";
import { LockIcon } from "./icons";

const PARENT_ACCENT = "#F68D68";

type LockKind = "profile" | "billing";

/**
 * Inline banner shown at the top of a child's own Profile / Billing screen
 * when their guardian controls it.
 */
export function GuardianBanner({ kind = "profile" }: { kind?: LockKind }) {
  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 18,
        paddingVertical: 12,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "rgba(246,141,104,0.10)",
        borderWidth: 1,
        borderColor: "rgba(246,141,104,0.30)",
        borderRadius: 14,
      }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          flexShrink: 0,
          backgroundColor: "rgba(246,141,104,0.16)",
          borderWidth: 1,
          borderColor: "rgba(246,141,104,0.34)",
          alignItems: "center",
          justifyContent: "center",
        }}>
        <LockIcon size={16} color={PARENT_ACCENT} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 13.5,
            fontWeight: "700",
            color: colors.textPrimary,
          }}>
          Managed by your guardian
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 12,
            color: colors.textSecondary,
            lineHeight: 17,
          }}>
          Your parent controls your{" "}
          {kind === "billing" ? "membership" : "profile settings"}.
        </Text>
      </View>
    </View>
  );
}

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
          fontFamily: fonts.body,
          fontSize: 14.5,
          fontWeight: "700",
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
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 17,
          fontWeight: "800",
          color: colors.textPrimary,
          letterSpacing: -17 * 0.02,
          marginBottom: 8,
          textAlign: "center",
        }}>
        {kind === "billing" ? "Membership is locked" : "Settings are locked"}
      </Text>
      <Text
        style={{
          fontFamily: fonts.body,
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
