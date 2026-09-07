import { styled } from "nativewind";
import { type ReactNode, type RefObject } from "react";
import { View } from "react-native";
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewRef,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/src/constants/theme";
import { AccentButton } from "./AccentButton";
import { BackButton } from "./BackButton";
import { ErrorBanner } from "./ErrorBanner";
import { BodySm, Hero, Label } from "./Typography";

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
            <Label className="mb-2" style={{ color: accentColor }}>
              {stepLabel}
            </Label>
          ) : null}

          <Hero className="mb-1">{title}</Hero>

          <BodySm>{subtitle}</BodySm>
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
              <AccentButton
                accent={accentColor}
                loading={isSubmitting}
                onPress={onSubmit}>
                {submitLabel}
              </AccentButton>
            </View>
          </StyledSafeAreaView>
        </KeyboardStickyView>
      </View>

      {footer}
    </StyledSafeAreaView>
  );
}
