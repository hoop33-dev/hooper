import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { StyledSafeAreaView } from "@/src/lib/nativewind-interop";
import {
  Button,
  Heading3,
  Icon,
  Label,
  OtpInput,
  Text,
} from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import { useLocked } from "@/src/hooks/useLocked";
import { getSupabaseClient } from "@/src/lib/supabase";

export default function LockedScreen() {
  const router = useRouter();
  const { code, setCode, loading, authError, handleSubmit } = useLocked();

  async function handleSignOut() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/(auth)/welcome");
  }

  return (
    <StyledSafeAreaView className="bg-surface flex-1">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-center px-6 py-4">
          <Image
            source={require("../../assets/logo-light.png")}
            style={{ width: 80, height: 24 }}
            resizeMode="contain"
          />
        </View>

        {/* Lock icon */}
        <View className="items-center pt-8 pb-6">
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: colors.surfaceContainer,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="lock" size={40} color="primary" />
          </View>
          <Label className="text-on-surface-muted mt-4 tracking-widest">
            SAFETY FIRST
          </Label>
        </View>

        {/* Headline */}
        <View className="px-6 pb-6">
          <Heading3
            className="italic"
            style={{ transform: [{ skewX: "-10deg" }] }}
          >
            ALMOST ON COURT.
          </Heading3>
          <Text className="text-on-surface-muted mt-4">
            For players under 16, a parent or guardian needs to link your
            account to unlock the full Hoop 33 experience.
          </Text>
          <Text className="text-on-surface-muted mt-3">
            Ask them to open Hoop 33 and tap{" "}
            <Text className="text-on-surface">Generate Link Code</Text>, then
            enter the 6-character code below.
          </Text>
        </View>

        {/* Form */}
        <View className="gap-4 px-6">
          <OtpInput
            length={6}
            value={code}
            onChange={setCode}
            numeric={false}
            label="LINK CODE"
            error={authError ?? undefined}
          />

          <Button
            variant="primary"
            size="lg"
            iconRight="link"
            className="mt-2 w-full"
            disabled={code.length !== 6 || loading}
            loading={loading}
            onPress={() => void handleSubmit()}
          >
            Link Account
          </Button>

          <Button
            variant="outline"
            iconRight="log-out"
            className="w-full"
            onPress={() => void handleSignOut()}
          >
            Sign Out
          </Button>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </StyledSafeAreaView>
  );
}
