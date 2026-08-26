import { useRouter } from "expo-router";
import { styled } from "nativewind";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";

import {
  AccentButton,
  BackButton,
  BodySm,
  Caption,
  Hero,
  IconTile,
  MicroLabel,
  Overline,
  Pill,
  RowTitle,
} from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import { sendSecurityCode } from "@/src/services/auth.service";
import { useAuthStore } from "@/src/stores/auth.store";

const StyledSafeAreaView = styled(SafeAreaView);

function LockIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect
        x={3}
        y={11}
        width={18}
        height={11}
        rx={3}
        stroke={colors.brandOrange}
        strokeWidth={1.8}
      />
      <Path
        d="M7 11V7a5 5 0 0110 0v4"
        stroke={colors.brandOrange}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M12 16v1"
        stroke={colors.brandOrange}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PhoneIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect
        x={5}
        y={2}
        width={14}
        height={20}
        rx={3}
        stroke={colors.textTertiary}
        strokeWidth={1.8}
      />
      <Path
        d="M12 18h.01"
        stroke={colors.textTertiary}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function MailIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect
        x={2}
        y={4}
        width={20}
        height={16}
        rx={3}
        stroke="#fff"
        strokeWidth={1.8}
      />
      <Path
        d="M2 8l10 7 10-7"
        stroke="#fff"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

type PasswordCardProps = {
  maskedEmail: string;
  isSending: boolean;
  sendError: string;
  onPress: () => void;
};

function PasswordCard({
  maskedEmail,
  isSending,
  sendError,
  onPress,
}: PasswordCardProps) {
  return (
    <View className="bg-surface-2 border-border-subtle gap-4 rounded-[18px] border p-5">
      <View className="flex-row items-start gap-3.5">
        <IconTile
          color={colors.brandOrange}
          size={44}
          radius={12}
          bgAlpha="1a"
          borderAlpha="33">
          <LockIcon />
        </IconTile>
        <View className="flex-1">
          <RowTitle className="mb-1">Change your password</RowTitle>
          {maskedEmail ? (
            <BodySm>
              {"We'll send a verification code to "}
              <Text className="text-text-primary font-semibold">
                {maskedEmail}
              </Text>
              {" to confirm it's you."}
            </BodySm>
          ) : null}
        </View>
      </View>
      {sendError ? (
        <Caption className="text-danger">{sendError}</Caption>
      ) : null}
      <AccentButton
        accent={colors.brandOrange}
        loading={isSending}
        icon={<MailIcon />}
        onPress={onPress}>
        Send reset email
      </AccentButton>
    </View>
  );
}

function TwoFactorSection() {
  return (
    <View className="border-border-subtle bg-surface-2 flex-row items-center gap-3.5 rounded-2xl border px-4 py-3.5 opacity-50">
      <View className="border-border-subtle h-[38px] w-[38px] items-center justify-center rounded-[10px] border bg-white/[0.06]">
        <PhoneIcon />
      </View>
      <View className="flex-1">
        <RowTitle>Two-factor auth</RowTitle>
        <Caption className="mt-0.5">SMS or authenticator app</Caption>
      </View>
      <Pill>
        <MicroLabel>Soon</MicroLabel>
      </Pill>
    </View>
  );
}

export default function SecurityScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const email = session?.user?.email ?? "";
  const maskedEmail = email.replace(
    /(.{2})(.*)(@.*)/,
    (_m, a, _b, c) => `${a}···${c}`,
  );

  async function handleSendCode() {
    if (isSending) return;
    setIsSending(true);
    setSendError("");
    const result = await sendSecurityCode();
    setIsSending(false);
    if (!result.ok) {
      setSendError(result.error);
      return;
    }
    router.push("/(app)/security-verify");
  }

  return (
    <StyledSafeAreaView className="bg-surface flex-1" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 pt-2 pb-7">
          <BackButton
            label="Profile"
            onPress={() => router.back()}
            className="mb-6"
          />
          <Hero>Security</Hero>
        </View>
        <View className="mb-7 px-6">
          <Overline className="mb-2.5">Password</Overline>
          <PasswordCard
            maskedEmail={maskedEmail}
            isSending={isSending}
            sendError={sendError}
            onPress={handleSendCode}
          />
        </View>
        <View className="px-6">
          <Overline className="mb-2.5">Two-Factor Authentication</Overline>
          <TwoFactorSection />
        </View>
      </ScrollView>
    </StyledSafeAreaView>
  );
}
