import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  Platform,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import Svg, { Path, Rect } from "react-native-svg";

type DateInputProps = {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  maxDate?: Date;
  minDate?: Date;
  error?: string;
  placeholder?: string;
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
}: DateInputProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value ?? new Date(2000, 0, 1));

  const borderColor = error
    ? "#E53E3E"
    : showPicker
      ? "rgba(255,255,255,0.25)"
      : "rgba(255,255,255,0.08)";

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
      if (event.type === "set" && selectedDate) {
        onChange(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
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
      <View style={{ gap: 6 }}>
        {label ? (
          <Text
            style={{
              fontFamily: "Inter",
              fontWeight: "500",
              fontSize: 10,
              letterSpacing: 10 * 0.12,
              textTransform: "uppercase",
              color: error ? "#E53E3E" : "rgba(255,255,255,0.35)",
            }}
          >
            {label}
          </Text>
        ) : null}

        <Pressable
          onPress={() => setShowPicker(true)}
          style={{
            height: 48,
            backgroundColor: "#2D2829",
            borderWidth: 1.5,
            borderColor,
            borderRadius: 10,
            paddingHorizontal: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 15,
              color: value
                ? "rgba(255,255,255,0.85)"
                : "rgba(255,255,255,0.25)",
            }}
          >
            {value ? formatDate(value) : placeholder}
          </Text>

          <CalendarIcon />
        </Pressable>

        {error ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
              <Path
                d="M6 1C3.24 1 1 3.24 1 6s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 2.5v3"
                stroke="#E53E3E"
                strokeWidth={1.2}
                strokeLinecap="round"
              />
              <Path d="M6 9a.5.5 0 100-1 .5.5 0 000 1z" fill="#E53E3E" />
            </Svg>
            <Text
              style={{ fontFamily: "Inter", fontSize: 11, color: "#E53E3E" }}
            >
              {error}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Android: render picker directly (shows as native dialog) */}
      {Platform.OS === "android" && showPicker && (
        <DateTimePicker
          mode="date"
          display="default"
          value={tempDate}
          onChange={handleChange}
          maximumDate={maxDate}
          minimumDate={minDate}
        />
      )}

      {/* iOS: render in a bottom sheet modal */}
      {Platform.OS === "ios" && (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={handleCancel}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
            onPress={handleCancel}
          />
          <SafeAreaView
            style={{
              backgroundColor: "#2D2829",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderTopWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingTop: 16,
                paddingBottom: 8,
              }}
            >
              <TouchableOpacity onPress={handleCancel} activeOpacity={0.7}>
                <Text
                  style={{
                    fontFamily: "Inter",
                    fontSize: 15,
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "rgba(255,255,255,0.16)",
                }}
              />

              <TouchableOpacity onPress={handleDone} activeOpacity={0.7}>
                <Text
                  style={{
                    fontFamily: "Inter",
                    fontWeight: "600",
                    fontSize: 15,
                    color: "#F15825",
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
              style={{ height: 200 }}
            />
          </SafeAreaView>
        </Modal>
      )}
    </>
  );
}
