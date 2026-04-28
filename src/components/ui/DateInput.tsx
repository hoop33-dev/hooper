import { useState, useEffect } from "react";
import { View, Text, Pressable, Modal, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import Svg, { Path, Rect } from "react-native-svg";
import { ErrorMessage } from "./ErrorMessage";

const StyledSafeAreaView = styled(SafeAreaView);

type DateInputProps = {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  maxDate?: Date;
  minDate?: Date;
  error?: string;
  placeholder?: string;
  /** Accent color used for iOS picker highlight and Android dialog button text. */
  accentColor?: string;
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-NZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function CalendarIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Rect
        x={1.5}
        y={2.5}
        width={15}
        height={14}
        rx={2.5}
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={1.4}
      />
      <Path
        d="M1.5 7h15"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Path
        d="M5.5 1v3M12.5 1v3"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function DateInput({
  label,
  value,
  onChange,
  maxDate,
  minDate,
  error,
  placeholder = "Select date",
  accentColor,
}: DateInputProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value ?? new Date(2000, 0, 1));

  // Keep tempDate in sync when the external value changes (e.g. form reset)
  useEffect(() => {
    if (value) setTempDate(value);
  }, [value]);

  const borderClass = error
    ? "border-danger"
    : showPicker
      ? "border-white/25"
      : "border-border-subtle";

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) setTempDate(selectedDate);
  };

  const handleDone = () => {
    onChange(tempDate);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setTempDate(value ?? new Date(2000, 0, 1));
    setShowPicker(false);
  };

  return (
    <>
      <View className="gap-1.5">
        {label && (
          <Text
            className={
              error ? "text-danger uppercase" : "text-text-tertiary uppercase"
            }
            style={{
              fontFamily: "Inter",
              fontWeight: "500",
              fontSize: 10,
              letterSpacing: 10 * 0.12,
            }}
          >
            {label}
          </Text>
        )}

        <Pressable
          onPress={() => setShowPicker(true)}
          className={`bg-surface-2 flex-row items-center justify-between rounded-[10px] border-[1.5px] px-5 ${borderClass}`}
          style={{ height: 48 }}
        >
          <Text
            className={`text-[15px] ${value ? "text-text-primary" : "text-text-disabled"}`}
            style={{ fontFamily: "Inter" }}
          >
            {value ? formatDate(value) : placeholder}
          </Text>

          <CalendarIcon />
        </Pressable>

        {error && <ErrorMessage message={error} />}
      </View>

      {/* Bottom sheet modal — same on iOS and Android */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <Pressable className="flex-1 bg-black/60" onPress={handleCancel} />
        <StyledSafeAreaView className="bg-surface-2 border-border-subtle rounded-t-[20px] border-t">
          <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
            <TouchableOpacity onPress={handleCancel} activeOpacity={0.7}>
              <Text
                className="text-[15px] text-white/50"
                style={{ fontFamily: "Inter" }}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <View className="bg-border-strong h-1 w-9 rounded-full" />

            <TouchableOpacity onPress={handleDone} activeOpacity={0.7}>
              <Text
                className="text-[15px] font-semibold"
                style={{
                  fontFamily: "Inter",
                  color: accentColor ?? "#F15825",
                }}
              >
                Done
              </Text>
            </TouchableOpacity>
          </View>

          <DateTimePicker
            mode="date"
            display="spinner"
            value={tempDate}
            onChange={handleChange}
            maximumDate={maxDate}
            minimumDate={minDate}
            themeVariant="dark"
            accentColor={accentColor}
            style={{ height: 200 }}
          />
        </StyledSafeAreaView>
      </Modal>
    </>
  );
}
