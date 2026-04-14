import { useState } from "react";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyledSafeAreaView } from "@/src/lib/nativewind-interop";
import {
  Button,
  DateInput,
  Heading1,
  Heading4,
  InlineButton,
  Input,
  Label,
  Text,
  TextSM,
} from "@/src/components/ui";
import { supabase } from "@/src/lib/supabase";
import { colors, fonts } from "@/src/constants/theme";

const HERO_IMAGE_URI =
  "https://d11n7da8rpqbjy.cloudfront.net/u346976/357_1743466712nAhDSC07234.jpg";

const styles = StyleSheet.create({
  vignetteTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "40%",
  },
  vignetteBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
  },
});

export default function RegisterScreen() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignUp() {
    setError("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!dateOfBirth) {
      setError("Please enter your date of birth.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const dob = dateOfBirth.toISOString().split("T")[0];

      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            date_of_birth: dob,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      router.push({
        pathname: "/(auth)/verify",
        params: {
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dateOfBirth: dob,
        },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StyledSafeAreaView className="flex-1 bg-surface">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <View style={{ height: 220 }}>
          <ImageBackground
            source={{ uri: HERO_IMAGE_URI }}
            resizeMode="cover"
            style={{ flex: 1 }}
          >
            <View className="absolute inset-0 bg-[rgba(0,0,0,0.35)]" />
            <LinearGradient
              colors={["rgba(0,0,0,0.6)", "transparent"]}
              style={styles.vignetteTop}
            />
            <LinearGradient
              colors={["transparent", colors.surface]}
              style={styles.vignetteBottom}
            />

            {/* Back button */}
            <View className="flex-row items-center px-5 pt-2">
              <Pressable
                onPress={() => router.back()}
                hitSlop={12}
                className="mr-3"
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={colors.onSurface}
                />
              </Pressable>
              <Image
                source={require("../../assets/logo-light.png")}
                style={{ width: 80, height: 24 }}
                resizeMode="contain"
              />
            </View>

            {/* Hero copy */}
            <View className="mt-auto px-6 pb-4">
              <Heading1 style={{ fontStyle: "italic" }}>{"LEVEL\nUP."}</Heading1>
              <Label
                className="mt-1 tracking-widest text-on-surface-muted uppercase"
              >
                JOIN THE ELITE TRAINING NETWORK
              </Label>
            </View>
          </ImageBackground>
        </View>

        {/* ── Form ──────────────────────────────────────────────── */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, gap: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ gap: 4 }}>
            <Heading4>Create Account</Heading4>
            <TextSM className="text-on-surface-muted">
              Enter your details to start your journey.
            </TextSM>
          </View>

          <View style={{ gap: 14 }}>
            <Input
              label="FIRST NAME"
              leftIcon="person-outline"
              placeholder="First name"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              autoCorrect={false}
            />

            <Input
              label="LAST NAME"
              leftIcon="person-outline"
              placeholder="Last name"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              autoCorrect={false}
            />

            <Input
              label="EMAIL ADDRESS"
              leftIcon="mail-outline"
              placeholder="player@hoop33.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <DateInput
              label="DATE OF BIRTH"
              value={dateOfBirth}
              onChange={setDateOfBirth}
              placeholder="mm / dd / yyyy"
            />

            <Input
              label="PASSWORD"
              leftIcon="lock-closed-outline"
              rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
              onRightIconPress={() => setShowPassword((v) => !v)}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {error ? (
            <TextSM style={{ color: colors.primary }}>{error}</TextSM>
          ) : null}

          <Button
            onPress={handleSignUp}
            disabled={loading}
            size="lg"
            className="mt-2"
          >
            {loading ? "CREATING ACCOUNT…" : "CREATE ACCOUNT"}
          </Button>

          <View className="mt-2 flex-row items-center justify-center">
            <Text className="text-on-surface-muted">
              {"Already have an account? "}
            </Text>
            <InlineButton onPress={() => router.push("/(auth)/login")}>
              Sign In
            </InlineButton>
          </View>

          {/* Bottom padding so content clears the keyboard */}
          <View style={{ height: 32 }} />
        </ScrollView>
      </StyledSafeAreaView>
    </KeyboardAvoidingView>
  );
}
