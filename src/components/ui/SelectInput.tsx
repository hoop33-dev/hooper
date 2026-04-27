import { useState } from "react";
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

export function SelectInput({
  label,
  value,
  options,
  placeholder = "Select an option",
  error,
  onChange,
}: SelectInputProps) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);

  const selected = options.find((o) => o.value === value);

  const borderColor = error
    ? "#E53E3E"
    : focused
      ? "rgba(255,255,255,0.25)"
      : "rgba(255,255,255,0.08)";

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
          onPress={() => {
            setOpen(true);
            setFocused(true);
          }}
          style={{
            height: 48,
            backgroundColor: "#2D2829",
            borderWidth: 1.5,
            borderColor,
            borderRadius: 10,
            paddingHorizontal: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 15,
              color: selected
                ? "rgba(255,255,255,0.85)"
                : "rgba(255,255,255,0.25)",
              flex: 1,
            }}
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
              style={{
                fontFamily: "Inter",
                fontSize: 11,
                color: "#E53E3E",
              }}
            >
              {error}
            </Text>
          </View>
        ) : null}
      </View>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setOpen(false);
          setFocused(false);
        }}
      >
        {/* Backdrop */}
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
          onPress={() => {
            setOpen(false);
            setFocused(false);
          }}
        />

        {/* Bottom sheet */}
        <SafeAreaView
          style={{
            backgroundColor: "#2D2829",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: "70%",
            borderTopWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          {/* Handle + header */}
          <View
            style={{
              alignItems: "center",
              paddingTop: 12,
              paddingBottom: 8,
            }}
          >
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.16)",
                marginBottom: 16,
              }}
            />
            {label ? (
              <Text
                style={{
                  fontFamily: "Inter",
                  fontWeight: "600",
                  fontSize: 15,
                  color: "#FFFFFF",
                  marginBottom: 8,
                }}
              >
                {label}
              </Text>
            ) : null}
          </View>

          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            style={{ paddingHorizontal: 16 }}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = item.value === value;
              return (
                <TouchableOpacity
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                    setFocused(false);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 14,
                    paddingHorizontal: 4,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(255,255,255,0.06)",
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      fontFamily: "Inter",
                      fontSize: 15,
                      color: isSelected ? "#F15825" : "rgba(255,255,255,0.85)",
                      fontWeight: isSelected ? "600" : "400",
                    }}
                  >
                    {item.label}
                  </Text>

                  {isSelected && (
                    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
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
}
