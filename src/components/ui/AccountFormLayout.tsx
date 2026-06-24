import { styled } from "nativewind";
import { type ReactNode, type RefObject } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewRef,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fonts } from "@/src/constants/theme";
import { BackButton } from "./BackButton";
import { ErrorBanner } from "./ErrorBanner";

const StyledSafeAreaView = styled(SafeAreaView);

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
    <StyledSafeAreaView className="bg-surface flex-1" edges={["top"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-2 pb-4">
          <BackButton label={backLabel} onPress={onBack} />

          {stepLabel ? (
            <Text
              className="mb-2 text-[10px] font-medium uppercase"
              style={{
                fontFamily: fonts.body,
                letterSpacing: 10 * 0.14,
                color: accentColor,
              }}>
              {stepLabel}
            </Text>
          ) : null}

          <Text
            className="text-text-primary mb-1 font-black"
            style={{
              fontFamily: fonts.body,
              fontSize: 26,
              letterSpacing: 26 * -0.03,
              lineHeight: 26 * 1.12,
            }}>
            {title}
          </Text>

          <Text
            className="text-text-secondary text-[13px]"
            style={{ fontFamily: fonts.body, lineHeight: 13 * 1.5 }}>
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
          bottomOffset={120}>
          {submitError ? <ErrorBanner message={submitError} /> : null}
          {children}
        </KeyboardAwareScrollView>

        {/* Sticky CTA */}
        <KeyboardStickyView>
          <StyledSafeAreaView edges={["bottom"]} className="bg-surface">
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
                })}>
                {isSubmitting ? (
                  <ActivityIndicator color={colors.textPrimary} />
                ) : (
                  <Text
                    style={{
                      fontFamily: fonts.body,
                      fontWeight: "700",
                      fontSize: 15,
                      letterSpacing: 15 * 0.08,
                      textTransform: "uppercase",
                      color: colors.textPrimary,
                    }}>
                    {submitLabel}
                  </Text>
                )}
              </Pressable>
            </View>
          </StyledSafeAreaView>
        </KeyboardStickyView>
      </View>

      {footer}
    </StyledSafeAreaView>
  );
}
