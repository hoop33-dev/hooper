import { type ReactNode, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { CameraIcon } from "@/src/components/dashboard/icons";
import { colors } from "@/src/constants/theme";

function ImageIcon({ size = 20, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 5.5A2.5 2.5 0 015.5 3h13A2.5 2.5 0 0121 5.5v13A2.5 2.5 0 0118.5 21h-13A2.5 2.5 0 013 18.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.5 11a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
        stroke={color}
        strokeWidth={1.8}
      />
      <Path
        d="M21 15l-4.5-4.5L6 21"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** A single tappable row inside the photo-source sheet. */
function SheetOption({
  icon,
  label,
  accent,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  accent: string;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      style={[
        styles.option,
        pressed && { backgroundColor: "rgba(255,255,255,0.06)" },
      ]}>
      <View
        style={[
          styles.optionIcon,
          { backgroundColor: `${accent}14`, borderColor: `${accent}30` },
        ]}>
        {icon}
      </View>
      <Text style={styles.optionLabel}>{label}</Text>
    </Pressable>
  );
}

type PhotoSourceSheetProps = {
  visible: boolean;
  accent: string;
  onCamera: () => void;
  onLibrary: () => void;
  onCancel: () => void;
};

/** Bottom-sheet asking the user where to source their photo from. */
export function PhotoSourceSheet({
  visible,
  accent,
  onCamera,
  onLibrary,
  onCancel,
}: PhotoSourceSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        {/* Swallow taps inside the sheet so they don't dismiss it. */}
        <Pressable onPress={() => {}}>
          <SafeAreaView edges={["bottom"]} style={styles.sheet}>
            <View style={styles.grabber} />
            <Text style={styles.title}>Change photo</Text>
            <Text style={styles.subtitle}>
              Choose where to get your new profile photo.
            </Text>

            <View style={{ gap: 8 }}>
              <SheetOption
                icon={<CameraIcon size={18} color={accent} />}
                label="Take photo"
                accent={accent}
                onPress={onCamera}
              />
              <SheetOption
                icon={<ImageIcon size={18} color={accent} />}
                label="Choose from library"
                accent={accent}
                onPress={onLibrary}
              />
            </View>

            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              style={styles.cancel}>
              <Text style={styles.cancelLabel}>Cancel</Text>
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginBottom: 18,
  },
  title: {
    fontFamily: "Outfit",
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "Outfit",
    fontSize: 13,
    color: colors.textTertiary,
    marginBottom: 18,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 14,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: {
    fontFamily: "Outfit",
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  cancel: {
    height: 50,
    marginTop: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cancelLabel: {
    fontFamily: "Outfit",
    fontSize: 15,
    fontWeight: "700",
    color: colors.textSecondary,
  },
});
