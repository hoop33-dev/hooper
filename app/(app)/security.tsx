import { useRouter } from "expo-router";
import { styled } from "nativewind";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";

import { BackButton } from "@/src/components/ui";
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

function SectionHead({ title }: { title: string }) {
  return (
    <Text
      style={{
        fontFamily: "Inter",
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 10 * 0.14,
        textTransform: "uppercase",
        color: colors.textTertiary,
        marginBottom: 10,
      }}>
      {title}
    </Text>
  );
}

function SendEmailButton({
  isSending,
  onPress,
}: {
  isSending: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={isSending}
      style={({ pressed }) => ({
        height: 52,
        borderRadius: 14,
        backgroundColor: colors.brandOrange,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        opacity: isSending ? 0.7 : pressed ? 0.85 : 1,
        shadowColor: colors.brandOrange,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
      })}>
      {isSending ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
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
          <Text
            style={{
              fontFamily: "Inter",
              fontWeight: "600",
              fontSize: 15,
              color: "#fff",
            }}>
            Send reset email
          </Text>
        </>
      )}
    </Pressable>
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
    <View
      style={{
        backgroundColor: colors.surface2,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        borderRadius: 18,
        padding: 20,
        gap: 16,
      }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: colors.orangeTint10,
            borderWidth: 1,
            borderColor: colors.orangeTint20,
            alignItems: "center",
            justifyContent: "center",
          }}>
          <LockIcon />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: "Inter",
              fontWeight: "700",
              fontSize: 15,
              color: colors.textPrimary,
              marginBottom: 4,
            }}>
            Change your password
          </Text>
          {maskedEmail ? (
            <Text
              style={{
                fontFamily: "Inter",
                fontSize: 13,
                color: colors.textSecondary,
                lineHeight: 13 * 1.55,
              }}>
              {"We'll send a verification code to "}
              <Text style={{ fontWeight: "600", color: colors.textPrimary }}>
                {maskedEmail}
              </Text>
              {" to confirm it's you."}
            </Text>
          ) : null}
        </View>
      </View>
      {sendError ? (
        <Text
          style={{ fontFamily: "Inter", fontSize: 12, color: colors.danger }}>
          {sendError}
        </Text>
      ) : null}
      <SendEmailButton isSending={isSending} onPress={onPress} />
    </View>
  );
}

function TwoFactorSection() {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: colors.surface2,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        borderRadius: 14,
        opacity: 0.5,
      }}>
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          backgroundColor: "rgba(255,255,255,0.06)",
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          alignItems: "center",
          justifyContent: "center",
        }}>
        <PhoneIcon />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: "Inter",
            fontSize: 14.5,
            fontWeight: "600",
            color: colors.textPrimary,
            marginBottom: 2,
          }}>
          Two-factor auth
        </Text>
        <Text
          style={{
            fontFamily: "Inter",
            fontSize: 12,
            color: colors.textTertiary,
          }}>
          SMS or authenticator app
        </Text>
      </View>
      <View
        style={{
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: colors.borderStrong,
        }}>
        <Text
          style={{
            fontFamily: "Inter",
            fontSize: 9,
            fontWeight: "700",
            letterSpacing: 9 * 0.12,
            textTransform: "uppercase",
            color: colors.textTertiary,
          }}>
          Soon
        </Text>
      </View>
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
        <View
          style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 28 }}>
          <BackButton
            label="Profile"
            onPress={() => router.back()}
            className="mb-5"
          />
          <Text
            style={{
              fontFamily: "Inter",
              fontWeight: "900",
              fontSize: 28,
              color: colors.textPrimary,
              letterSpacing: 28 * -0.03,
              lineHeight: 28 * 1.1,
            }}>
            Security
          </Text>
        </View>
        <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
          <SectionHead title="Password" />
          <PasswordCard
            maskedEmail={maskedEmail}
            isSending={isSending}
            sendError={sendError}
            onPress={handleSendCode}
          />
        </View>
        <View style={{ paddingHorizontal: 24 }}>
          <SectionHead title="Two-Factor Authentication" />
          <TwoFactorSection />
        </View>
      </ScrollView>
    </StyledSafeAreaView>
  );
}
