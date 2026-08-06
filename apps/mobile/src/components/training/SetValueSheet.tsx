import { Button, Caption, Label } from "@/src/components/ui";
import { bodyFont, colors } from "@/src/constants/theme";
import { useEffect, useState } from "react";
import { Modal, Pressable, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SetValueSheetProps = {
  visible: boolean;
  exerciseName: string;
  unitType: string;
  initialValue: number | null;
  onConfirm: (value: number) => void;
  onClose: () => void;
};

/** Bottom-sheet numeric entry for a single set — reps, weight, seconds,
 * whatever unit the coach configured. A plain numeric TextInput rather than
 * a custom digit-pad keeps this consistent with every other numeric field
 * in the app (Input.tsx). */
export function SetValueSheet({
  visible,
  exerciseName,
  unitType,
  initialValue,
  onConfirm,
  onClose,
}: SetValueSheetProps) {
  const [text, setText] = useState(initialValue !== null ? String(initialValue) : "");

  useEffect(() => {
    if (visible) setText(initialValue !== null ? String(initialValue) : "");
  }, [visible, initialValue]);

  const numeric = Number(text);
  const isValid = text.trim() !== "" && Number.isFinite(numeric) && numeric >= 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60" onPress={onClose} />
      <SafeAreaView
        edges={["bottom"]}
        className="bg-surface-2 border-border-strong rounded-t-[20px] border-t"
        style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <View className="bg-border-strong mb-5 h-1 w-9 self-center rounded-full" />
        <View className="mb-3 flex-row items-baseline gap-2">
          <Label>{unitType}</Label>
          <Caption>· {exerciseName}</Caption>
        </View>
        <View className="bg-surface-3 mb-4 flex-row items-center justify-between rounded-xl px-5 py-3">
          <TextInput
            autoFocus
            value={text}
            onChangeText={(v) => setText(v.replace(/[^0-9.]/g, ""))}
            keyboardType="decimal-pad"
            placeholder="—"
            placeholderTextColor={colors.textDisabled}
            style={{
              fontFamily: bodyFont("800"),
              fontSize: 40,
              color: colors.textPrimary,
              flex: 1,
            }}
          />
          <Caption>{unitType}</Caption>
        </View>
        <View className="pb-6">
          <Button
            variant="primary"
            size="lg"
            disabled={!isValid}
            onPress={() => isValid && onConfirm(numeric)}>
            Done
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
