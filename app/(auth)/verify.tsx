import { Image, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyledSafeAreaView } from "@/src/lib/nativewind-interop";
import {
  Button,
  Heading3,
  InlineButton,
  Input,
  Text,
  TextSM,
} from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import { useVerify } from "@/src/hooks/useVerify";

export default function VerifyScreen() {
  const router = useRouter();
  const {
    email,
    code,
    setCode,
    loading,
    authError,
    cooldown,
    handleVerify,
    handleResend,
  } = useVerify();

  return (
    <StyledSafeAreaView className="bg-surface flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-center px-6 py-4">
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            className="absolute left-6"
            hitSlop={8}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </Pressable>
          <Image
            source={require("../../assets/logo-light.png")}
            style={{ width: 80, height: 24 }}
            resizeMode="contain"
          />
        </View>

        {/* Content */}
        <View className="flex-1 gap-4 px-6 pt-8">
          <View className="gap-2">
            <Heading3
              className="italic"
              style={{ transform: [{ skewX: "-10deg" }] }}
            >
              VERIFY YOUR
            </Heading3>
            <Heading3
              className="text-primary italic"
              style={{ transform: [{ skewX: "-10deg" }] }}
            >
              ACCOUNT
            </Heading3>
          </View>

          <Text className="text-on-surface-muted">
            {"We've sent a 6-digit code to "}
            <Text className="text-on-surface font-semibold">{email ?? ""}</Text>
            {". Enter it below to verify your account."}
          </Text>

          {/* OTP input */}
          <View className="pt-4">
            <Input
              label="VERIFICATION CODE"
              placeholder="000000"
              value={code}
              onChangeText={(text) =>
                setCode(text.replace(/\D/g, "").slice(0, 6))
              }
              keyboardType="number-pad"
              maxLength={6}
              style={{ textAlign: "center", fontSize: 28, letterSpacing: 8 }}
              autoFocus
            />
          </View>

          {/* Auth error */}
          {authError && (
            <TextSM className="text-primary text-center">{authError}</TextSM>
          )}

          {/* CTA */}
          <Button
            variant="primary"
            size="lg"
            className="mt-2 w-full"
            disabled={loading || code.length !== 6}
            onPress={() => void handleVerify()}
          >
            VERIFY
          </Button>

          {/* Resend */}
          <View className="items-center pt-2">
            {cooldown > 0 ? (
              <TextSM className="text-on-surface-muted">
                Resend code in {cooldown}s
              </TextSM>
            ) : (
              <View className="flex-row items-center gap-1">
                <Text className="text-on-surface-muted">
                  Didn&apos;t receive a code?
                </Text>
                <InlineButton onPress={() => void handleResend()}>
                  Resend
                </InlineButton>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </StyledSafeAreaView>
  );
}
