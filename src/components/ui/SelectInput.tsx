import { useState, forwardRef, useImperativeHandle } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { ErrorMessage } from "./ErrorMessage";

export type SelectInputHandle = { open: () => void };

export type SelectOption = {
  label: string;
  value: string;
};

type SelectInputProps = {
  label?: string;
  value: string | null;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  onChange: (value: string) => void;
};

export const SelectInput = forwardRef<SelectInputHandle, SelectInputProps>(
  function SelectInput(
    {
      label,
      value,
      options,
      placeholder = "Select an option",
      error,
      onChange,
    },
    ref,
  ) {
    const [open, setOpen] = useState(false);

    useImperativeHandle(ref, () => ({ open: () => setOpen(true) }));

    const selected = options.find((o) => o.value === value);

    const borderClass = error
      ? "border-danger"
      : open
        ? "border-white/25"
        : "border-border-subtle";

    return (
      <>
        <View className="gap-1.5">
          {label && (
            <Text
              className={`font-inter font-medium text-[10px] tracking-[1.2px] uppercase ${error ? "text-danger" : "text-text-tertiary"}`}
            >
              {label}
            </Text>
          )}

          <Pressable
            onPress={() => setOpen(true)}
            className={`bg-surface-2 flex-row items-center justify-between rounded-[10px] border-[1.5px] px-5 ${borderClass}`}
            style={{ height: 48 }}
          >
            <Text
              className={`font-inter flex-1 text-[15px] ${selected ? "text-text-primary" : "text-text-disabled"}`}
              numberOfLines={1}
            >
              {selected ? selected.label : placeholder}
            </Text>

            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <Path
                d="M4 6L8 10L12 6"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>

          {error && <ErrorMessage message={error} />}
        </View>

        <Modal
          visible={open}
          transparent
          animationType="slide"
          onRequestClose={() => setOpen(false)}
        >
          <Pressable
            className="flex-1 bg-black/60"
            onPress={() => setOpen(false)}
          />

          <SafeAreaView
            className="bg-surface-2 border-border-subtle rounded-t-[20px] border-t"
            style={{ maxHeight: "70%" }}
          >
            <View className="items-center pt-3 pb-2">
              <View className="bg-border-strong mb-4 h-1 w-9 rounded-full" />
              {label && (
                <Text className="font-inter text-text-primary mb-2 text-[15px] font-semibold">
                  {label}
                </Text>
              )}
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 24,
              }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    className="flex-row items-center justify-between border-b border-white/[0.06] px-1 py-[14px]"
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`font-inter text-[15px] ${isSelected ? "text-brand-orange font-semibold" : "text-text-primary"}`}
                    >
                      {item.label}
                    </Text>

                    {isSelected && (
                      <Svg
                        width={18}
                        height={18}
                        viewBox="0 0 18 18"
                        fill="none"
                      >
                        <Path
                          d="M3 9l4.5 4.5L15 5"
                          stroke="#F15825"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </SafeAreaView>
        </Modal>
      </>
    );
  },
);
