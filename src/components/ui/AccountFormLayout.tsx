import { type ReactNode, type RefObject } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewRef,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "./BackButton";
import { ErrorBanner } from "./ErrorBanner";
import { colors } from "@/src/constants/theme";

type AccountFormLayoutProps = {
  // Navigation
  onBack: () => void;
  backLabel?: string;

  // Header
  stepLabel?: string;
  accentColor?: string;
  title: string;
  subtitle: ReactNode;

  // Scroll area
  scrollRef?: RefObject<KeyboardAwareScrollViewRef | null>;
  children: ReactNode;

  // Submit CTA
  submitLabel: string;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitError?: string | null;

  // Optional footer slot rendered below the submit button (e.g. modal)
  footer?: ReactNode;
};

export function AccountFormLayout({
  onBack,
  backLabel,
  stepLabel,
  accentColor = colors.brandOrange,
  title,
  subtitle,
  scrollRef,
  children,
  submitLabel,
  onSubmit,
  isSubmitting,
  submitError,
  footer,
}: AccountFormLayoutProps) {
  return (
    <SafeAreaView className="bg-surface flex-1" edges={["top"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-2 pb-4">
          <BackButton label={backLabel} onPress={onBack} />

          {stepLabel ? (
            <Text
              className="font-inter font-medium text-[10px] tracking-[1.4px] uppercase mb-2"
              style={{ color: accentColor }}
            >
              {stepLabel}
            </Text>
          ) : null}

          <Text className="font-inter font-black text-text-primary text-[26px] tracking-[-0.78px] leading-[29.12px] mb-1">
            {title}
          </Text>

          <Text className="font-inter text-text-secondary text-[13px] leading-[19.5px]">
            {subtitle}
          </Text>
        </View>

        {/* Scrollable form fields */}
        <KeyboardAwareScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: 24,
            gap: 16,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bottomOffset={120}
        >
          {submitError ? <ErrorBanner message={submitError} /> : null}
          {children}
        </KeyboardAwareScrollView>

        {/* Sticky CTA */}
        <KeyboardStickyView>
          <SafeAreaView edges={["bottom"]} className="bg-surface">
            <View className="px-6 py-3">
              <Pressable
                onPress={onSubmit}
                disabled={isSubmitting}
                style={({ pressed }) => ({
                  height: 56,
                  borderRadius: 9999,
                  backgroundColor: accentColor,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: isSubmitting ? 0.7 : pressed ? 0.85 : 1,
                  transform: [{ scale: pressed && !isSubmitting ? 0.97 : 1 }],
                  shadowColor: accentColor,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.35,
                  shadowRadius: 20,
                  elevation: 8,
                })}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.textPrimary} />
                ) : (
                  <Text className="font-inter font-bold text-[15px] tracking-[1.2px] uppercase text-text-primary">
                    {submitLabel}
                  </Text>
                )}
              </Pressable>
            </View>
          </SafeAreaView>
        </KeyboardStickyView>
      </View>

      {footer}
    </SafeAreaView>
  );
}
