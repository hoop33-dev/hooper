import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyledSafeAreaView } from "@/src/lib/nativewind-interop";
import {
  Button,
  Heading2,
  InlineButton,
  Label,
  Pill,
  Text,
  TextSM,
} from "@/src/components/ui";
import { supabase } from "@/src/lib/supabase";
import { colors, fonts } from "@/src/constants/theme";

const STEPS = [
  "Ask a parent to log in to their account.",
  "Head to Settings > Link Child to get a code.",
  "Enter the 6-character code below.",
];

export default function LockedScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLink() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 6) {
      setError("Please enter the full 6-character code.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const { error: fnError } = await supabase.functions.invoke(
        "redeem-link-code",
        { body: { code: trimmed } },
      );

      if (fnError) {
        setError(fnError.message ?? "Invalid or expired code. Please try again.");
        return;
      }

      // TODO: navigate to main app once root (tabs) screen exists
      router.replace("/(auth)/welcome");
    } finally {
      setLoading(false);
    }
  }

  return (
    <StyledSafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 px-6">
        {/* Lock icon */}
        <View className="mt-10 items-center gap-3">
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: colors.surfaceHigh,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="lock-closed" size={44} color={colors.primary} />
          </View>
          <Pill variant="primary">SAFETY FIRST</Pill>
        </View>

        {/* Heading */}
        <View className="mt-6 items-center">
          <Heading2
            className="text-center uppercase"
            style={{ fontStyle: "italic" }}
          >
            ALMOST ON COURT.
          </Heading2>
          <Text className="mt-3 text-center text-on-surface-muted">
            For players under 16, a parent or guardian needs to link your
            account to unlock the full Hoop 33 experience.
          </Text>
        </View>

        {/* Steps */}
        <View
          style={{
            marginTop: 24,
            borderLeftWidth: 2,
            borderLeftColor: colors.primary,
            paddingLeft: 16,
            gap: 14,
          }}
        >
          {STEPS.map((step, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 1,
                  flexShrink: 0,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 12,
                    color: "#fff",
                    lineHeight: 14,
                  }}
                >
                  {i + 1}
                </Text>
              </View>
              <Text className="flex-1 text-on-surface-muted">{step}</Text>
            </View>
          ))}
        </View>

        {/* Code input */}
        <View className="mt-8">
          <Label className="mb-3 tracking-widest text-on-surface-muted uppercase">
            PARENT LINK CODE
          </Label>
          <TextInput
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            placeholder="H33-XXX"
            placeholderTextColor={colors.onSurfaceFaint}
            maxLength={7}
            autoCapitalize="characters"
            autoCorrect={false}
            style={{
              backgroundColor: colors.surfaceHigh,
              borderRadius: 16,
              paddingHorizontal: 24,
              paddingVertical: 18,
              fontFamily: fonts.black,
              fontSize: 28,
              color: colors.onSurface,
              textAlign: "center",
              letterSpacing: 6,
              borderWidth: 1,
              borderColor: code ? colors.primary : "transparent",
            }}
          />
        </View>

        {error ? (
          <TextSM className="mt-3" style={{ color: colors.primary }}>
            {error}
          </TextSM>
        ) : null}

        {/* CTA */}
        <Button
          onPress={handleLink}
          disabled={loading}
          size="lg"
          iconRight="flash"
          className="mt-6"
        >
          {loading ? "LINKING…" : "LINK ACCOUNT"}
        </Button>

        {/* No account link */}
        <View className="mt-5 items-center">
          <Pressable onPress={() => router.push("/(auth)/register")}>
            <Label className="tracking-widest text-on-surface-muted uppercase">
              I DON'T HAVE AN ACCOUNT YET
            </Label>
          </Pressable>
        </View>
      </View>
    </StyledSafeAreaView>
  );
}
