import {
  Image,
  Pressable,
  ScrollView,
  Text as RNText,
  View,
} from "react-native";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyledSafeAreaView } from "@/src/lib/nativewind-interop";
import {
  Button,
  Checkbox,
  DateInput,
  Heading2,
  InlineButton,
  Input,
  PhoneInput,
  SelectInput,
  Text,
  TextSM,
} from "@/src/components/ui";
import { colors, fonts } from "@/src/constants/theme";
import { NZ_REGIONS } from "@/src/constants/regions";
import { useSignUp } from "@/src/hooks/useSignUp";

const TERMS_URL = "https://www.hoop33.co.nz/terms";
const PRIVACY_URL = "https://www.hoop33.co.nz/privacypolicy";

export default function RegisterScreen() {
  const router = useRouter();
  const {
    firstName,
    lastName,
    dateOfBirth,
    email,
    phone,
    parentName,
    parentEmail,
    parentPhone,
    region,
    password,
    confirmPassword,
    showPassword,
    showConfirmPassword,
    agreedToTerms,
    setFirstName,
    setLastName,
    setDateOfBirth,
    setEmail,
    setPhone,
    setParentName,
    setParentEmail,
    setParentPhone,
    setRegion,
    setPassword,
    setConfirmPassword,
    setShowPassword,
    setShowConfirmPassword,
    setAgreedToTerms,
    isMinor,
    errors,
    authError,
    loading,
    handleSubmit,
  } = useSignUp();

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

        {/* Headline */}
        <View className="px-6 pt-4 pb-6">
          <Heading2
            className="italic"
            style={{ transform: [{ skewX: "-10deg" }] }}
          >
            CREATE YOUR
          </Heading2>
          <Heading2
            className="text-primary italic"
            style={{ transform: [{ skewX: "-10deg" }] }}
          >
            LEGACY
          </Heading2>
          <Text className="text-on-surface-muted mt-3">
            Enter the arena. Level up your game with elite coaching.
          </Text>
        </View>

        {/* Form */}
        <View className="gap-4 px-6">
          <Input
            label="FIRST NAME"
            placeholder="Jamal"
            value={firstName}
            onChangeText={setFirstName}
            error={errors.firstName}
            autoCapitalize="words"
            autoComplete="given-name"
          />

          <Input
            label="LAST NAME"
            placeholder="Murray"
            value={lastName}
            onChangeText={setLastName}
            error={errors.lastName}
            autoCapitalize="words"
            autoComplete="family-name"
          />

          <DateInput
            label="DATE OF BIRTH"
            type="date"
            value={dateOfBirth}
            onChange={setDateOfBirth}
            placeholder="mm/dd/yyyy"
            error={errors.dateOfBirth}
            maximumDate={new Date()}
          />

          {isMinor && (
            <>
              <Input
                label="PARENT NAME"
                placeholder="Full name"
                value={parentName}
                onChangeText={setParentName}
                error={errors.parentName}
                autoCapitalize="words"
              />
              <Input
                label="PARENT EMAIL"
                placeholder="parent@example.com"
                value={parentEmail}
                onChangeText={setParentEmail}
                error={errors.parentEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <PhoneInput
                label="PARENT PHONE"
                value={parentPhone}
                onChangeText={setParentPhone}
                error={errors.parentPhone}
                autoComplete="tel"
              />
            </>
          )}

          {!isMinor && (
            <>
              <Input
                label="EMAIL ADDRESS"
                placeholder="jamal.murray@elite.com"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <PhoneInput
                label="PHONE NUMBER"
                value={phone}
                onChangeText={setPhone}
                error={errors.phone}
                autoComplete="tel"
              />
            </>
          )}

          <SelectInput
            label="REGION"
            placeholder="Select your region"
            options={NZ_REGIONS}
            value={region}
            onChange={setRegion}
            error={errors.region}
          />

          <Input
            label="PASSWORD"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
            onRightIconPress={() => setShowPassword(!showPassword)}
            autoComplete="new-password"
          />

          <Input
            label="CONFIRM PASSWORD"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={errors.confirmPassword}
            secureTextEntry={!showConfirmPassword}
            rightIcon={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
            onRightIconPress={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
            autoComplete="new-password"
          />

          {/* Terms & Privacy */}
          <View className="flex-row items-start gap-3 pt-2">
            <Checkbox checked={agreedToTerms} onChange={setAgreedToTerms} />
            <RNText
              style={{
                flex: 1,
                fontFamily: fonts.regular,
                fontSize: 14,
                lineHeight: 20,
                color: colors.onSurfaceMuted,
              }}
            >
              {"By creating an account, you agree to the Hoop 33 "}
              <InlineButton onPress={() => void Linking.openURL(TERMS_URL)}>
                Terms of Service
              </InlineButton>
              {" and "}
              <InlineButton onPress={() => void Linking.openURL(PRIVACY_URL)}>
                Privacy Policy
              </InlineButton>
              {"."}
            </RNText>
          </View>
          {errors.agreedToTerms && (
            <TextSM className="text-primary -mt-2">
              {errors.agreedToTerms}
            </TextSM>
          )}

          {/* Auth error */}
          {authError && (
            <TextSM className="text-primary text-center">{authError}</TextSM>
          )}

          {/* CTA */}
          <Button
            variant="primary"
            size="lg"
            iconRight="chevron-forward"
            className="mt-2 w-full"
            disabled={loading}
            onPress={() => void handleSubmit()}
          >
            CREATE ACCOUNT
          </Button>
        </View>

        {/* Footer */}
        <View className="flex-row items-center justify-center gap-1 pt-6">
          <Text className="text-on-surface-muted">
            Already have an account?
          </Text>
          <InlineButton onPress={() => router.push("/(auth)/login")}>
            Sign In
          </InlineButton>
        </View>
      </ScrollView>
    </StyledSafeAreaView>
  );
}
