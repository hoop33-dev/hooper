import { useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { colors, fonts } from "@/src/constants/theme";
import { Icon } from "./Icon";
import { Ionicons } from "@expo/vector-icons";

export type InputSize = "sm" | "md" | "lg";
export type DateInputType = "date" | "time" | "datetime";

export interface SelectOption {
  label: string;
  value: string;
}

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const sizeConfig: Record<InputSize, { padding: string; fontSize: number }> = {
  sm: { padding: "px-4 py-2", fontSize: 14 },
  md: { padding: "px-5 py-3", fontSize: 16 },
  lg: { padding: "px-6 py-4", fontSize: 18 },
};

// ─── Internal shell shared by all three input variants ─────────────────────

interface InputShellProps {
  label?: string;
  error?: string;
  size?: InputSize;
  disabled?: boolean;
  focused?: boolean;
  className?: string;
  onPress?: () => void;
  children: React.ReactNode;
}

function InputShell({
  label,
  error,
  size = "md",
  disabled,
  focused,
  className = "",
  onPress,
  children,
}: InputShellProps) {
  const { padding } = sizeConfig[size];

  const borderColor = error
    ? "rgba(242,101,34,0.4)"
    : focused
      ? "rgba(242,101,34,0.2)"
      : "transparent";

  const pillContent = (
    <View
      className={`bg-surface-high flex-row items-center rounded-full ${padding} ${className}`}
      style={{ borderWidth: 1, borderColor }}
    >
      {children}
    </View>
  );

  return (
    <View style={{ opacity: disabled ? 0.4 : 1, gap: 6 }}>
      {label && (
        <Text
          style={{
            fontFamily: fonts.semibold,
            fontSize: 12,
            lineHeight: 14,
            color: colors.onSurface,
          }}
        >
          {label}
        </Text>
      )}

      {onPress ? (
        <Pressable onPress={onPress} disabled={disabled}>
          {pillContent}
        </Pressable>
      ) : (
        pillContent
      )}

      {error && (
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 12,
            color: colors.primary,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

// ─── Text Input ────────────────────────────────────────────────────────────

interface InputProps extends Omit<TextInputProps, "placeholderTextColor"> {
  label?: string;
  error?: string;
  leftIcon?: IoniconsName;
  rightIcon?: IoniconsName;
  onRightIconPress?: () => void;
  size?: InputSize;
  disabled?: boolean;
  className?: string;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  size = "md",
  disabled,
  className = "",
  style,
  onFocus: onFocusProp,
  onBlur: onBlurProp,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const { fontSize } = sizeConfig[size];

  return (
    <InputShell
      label={label}
      error={error}
      size={size}
      disabled={disabled}
      focused={focused}
      className={className}
    >
      {leftIcon && (
        <View style={{ marginRight: 8 }}>
          <Icon name={leftIcon} size={16} color="on-surface-muted" />
        </View>
      )}

      <TextInput
        {...props}
        style={[
          {
            flex: 1,
            fontFamily: fonts.regular,
            fontSize,
            color: colors.onSurface,
            alignSelf: "center",
            paddingTop: 0,
            paddingBottom: 0,
            textAlignVertical: "center",
          },
          style,
        ]}
        placeholderTextColor="rgba(245,245,245,0.4)"
        onFocus={(e) => {
          setFocused(true);
          onFocusProp?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlurProp?.(e);
        }}
        editable={!disabled}
      />

      {rightIcon && (
        <View style={{ marginLeft: 8 }}>
          {onRightIconPress ? (
            <Pressable onPress={onRightIconPress} disabled={disabled}>
              <Icon name={rightIcon} size={16} color="on-surface-muted" />
            </Pressable>
          ) : (
            <Icon name={rightIcon} size={16} color="on-surface-muted" />
          )}
        </View>
      )}
    </InputShell>
  );
}

// ─── Date / Time Input ─────────────────────────────────────────────────────

interface DateInputProps {
  type?: DateInputType;
  value?: Date;
  onChange?: (date: Date) => void;
  label?: string;
  error?: string;
  size?: InputSize;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

function formatDate(date: Date, type: DateInputType): string {
  if (type === "time") {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const datePart = date.toLocaleDateString();
  if (type === "date") return datePart;
  const timePart = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} ${timePart}`;
}

function defaultPlaceholder(type: DateInputType): string {
  if (type === "time") return "Select time";
  if (type === "datetime") return "Select date & time";
  return "Select date";
}

function iconForType(type: DateInputType): IoniconsName {
  return type === "time" ? "time-outline" : "calendar-outline";
}

export function DateInput({
  type = "date",
  value,
  onChange,
  label,
  error,
  size = "md",
  disabled,
  placeholder,
  className = "",
}: DateInputProps) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pendingDate, setPendingDate] = useState<Date>(value ?? new Date());
  // Android-only: tracks the two-step date→time flow for "datetime"
  const [androidDateStep, setAndroidDateStep] = useState<"date" | "time">(
    "date",
  );
  const [androidPartialDate, setAndroidPartialDate] = useState<Date>(
    value ?? new Date(),
  );

  const { fontSize } = sizeConfig[size];

  function handleOpen() {
    setPendingDate(value ?? new Date());
    setAndroidPartialDate(value ?? new Date());
    setAndroidDateStep("date");
    setPickerVisible(true);
  }

  // Android: auto-dismissing dialog; "datetime" uses two-step flow
  function handleAndroidChange(_event: DateTimePickerEvent, selected?: Date) {
    setPickerVisible(false);
    if (!selected) return;

    if (type === "datetime") {
      if (androidDateStep === "date") {
        setAndroidPartialDate(selected);
        setAndroidDateStep("time");
        // Re-open immediately for the time step
        setTimeout(() => setPickerVisible(true), 50);
      } else {
        // Merge date from step 1 and time from step 2
        const merged = new Date(androidPartialDate);
        merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        onChange?.(merged);
        setAndroidDateStep("date");
      }
    } else {
      onChange?.(selected);
    }
  }

  // iOS: spinner inside a modal; only commits on Confirm
  function handleIOSConfirm() {
    onChange?.(pendingDate);
    setPickerVisible(false);
  }

  const androidMode =
    type === "datetime"
      ? androidDateStep // "date" first, then "time"
      : type;

  return (
    <>
      <InputShell
        label={label}
        error={error}
        size={size}
        disabled={disabled}
        focused={pickerVisible}
        className={className}
        onPress={handleOpen}
      >
        <View style={{ marginRight: 8 }}>
          <Icon name={iconForType(type)} size={16} color="on-surface-muted" />
        </View>
        <Text
          style={{
            flex: 1,
            fontFamily: fonts.regular,
            fontSize,
            color: value ? colors.onSurface : "rgba(245,245,245,0.4)",
          }}
        >
          {value
            ? formatDate(value, type)
            : (placeholder ?? defaultPlaceholder(type))}
        </Text>
      </InputShell>

      {/* Android: DateTimePicker renders as a native dialog with no wrapper needed */}
      {Platform.OS === "android" && pickerVisible && (
        <DateTimePicker
          value={
            type === "datetime" ? androidPartialDate : (value ?? new Date())
          }
          mode={androidMode}
          onChange={handleAndroidChange}
        />
      )}

      {/* iOS: spinner wrapped in a slide-up modal with Cancel / Confirm */}
      {Platform.OS === "ios" && (
        <Modal
          visible={pickerVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setPickerVisible(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
            onPress={() => setPickerVisible(false)}
          />
          <View
            style={{
              backgroundColor: colors.surfaceContainer,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              gap: 16,
            }}
          >
            <DateTimePicker
              value={pendingDate}
              mode={type === "datetime" ? "datetime" : type}
              display="spinner"
              onChange={(_e, d) => d && setPendingDate(d)}
              style={{ alignSelf: "center" }}
              textColor={colors.onSurface}
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={() => setPickerVisible(false)}
                style={({ pressed }) => ({
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 12,
                  borderRadius: 999,
                  backgroundColor: colors.surfaceHighest,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 16,
                    color: colors.onSurface,
                  }}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleIOSConfirm}
                style={({ pressed }) => ({
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 12,
                  borderRadius: 999,
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 16,
                    color: "#FFFFFF",
                  }}
                >
                  Confirm
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

// ─── Select / Dropdown Input ───────────────────────────────────────────────

interface SelectInputProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  size?: InputSize;
  disabled?: boolean;
  className?: string;
}

export function SelectInput({
  options,
  value,
  onChange,
  placeholder = "Select…",
  label,
  error,
  size = "md",
  disabled,
  className = "",
}: SelectInputProps) {
  const [open, setOpen] = useState(false);

  const { fontSize } = sizeConfig[size];
  const selectedOption = options.find((o) => o.value === value);

  return (
    <>
      <InputShell
        label={label}
        error={error}
        size={size}
        disabled={disabled}
        focused={open}
        className={className}
        onPress={() => setOpen(true)}
      >
        <Text
          style={{
            flex: 1,
            fontFamily: fonts.regular,
            fontSize,
            color: selectedOption ? colors.onSurface : "rgba(245,245,245,0.4)",
          }}
        >
          {selectedOption?.label ?? placeholder}
        </Text>
        <View style={{ marginLeft: 8 }}>
          <Icon
            name={open ? "chevron-up" : "chevron-down"}
            size={16}
            color="on-surface-muted"
          />
        </View>
      </InputShell>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        {/* Overlay — tap to dismiss */}
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
          onPress={() => setOpen(false)}
        />

        {/* Bottom-sheet card */}
        <View
          style={{
            backgroundColor: colors.surfaceContainer,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "60%",
            paddingBottom: 24,
          }}
        >
          {/* Drag handle */}
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.surfaceHighest,
              alignSelf: "center",
              marginTop: 12,
              marginBottom: 8,
            }}
          />

          <FlatList
            data={options}
            keyExtractor={(o) => o.value}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = item.value === value;
              return (
                <Pressable
                  onPress={() => {
                    onChange?.(item.value);
                    setOpen(false);
                  }}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 24,
                    paddingVertical: 14,
                  })}
                >
                  <Text
                    style={{
                      fontFamily: isSelected ? fonts.semibold : fonts.regular,
                      fontSize: 16,
                      color: isSelected ? colors.primary : colors.onSurface,
                    }}
                  >
                    {item.label}
                  </Text>
                  {isSelected && (
                    <Icon name="checkmark" size={16} color="primary" />
                  )}
                </Pressable>
              );
            }}
            ItemSeparatorComponent={() => (
              <View
                style={{
                  height: 1,
                  backgroundColor: colors.surfaceHighest,
                  marginHorizontal: 24,
                }}
              />
            )}
          />
        </View>
      </Modal>
    </>
  );
}
