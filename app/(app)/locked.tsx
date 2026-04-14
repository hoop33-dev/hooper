import { Image, ScrollView, View } from "react-native";
import { StyledSafeAreaView } from "@/src/lib/nativewind-interop";
import { Button, Heading3, Input, Text, TextSM } from "@/src/components/ui";
import { useLocked } from "@/src/hooks/useLocked";

export default function LockedScreen() {
  const { code, setCode, loading, authError, handleSubmit } = useLocked();

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
          <Image
            source={require("../../assets/logo-light.png")}
            style={{ width: 80, height: 24 }}
            resizeMode="contain"
          />
        </View>

        {/* Headline */}
        <View className="px-6 pt-4 pb-6">
          <Heading3
            className="text-primary italic"
            style={{ transform: [{ skewX: "-10deg" }] }}
          >
            ACCOUNT LOCKED
          </Heading3>
          <Text className="text-on-surface-muted mt-4">
            Your account needs a parent or guardian to link their account before
            you can access the app.
          </Text>
          <Text className="text-on-surface-muted mt-3">
            Ask them to open Hoop 33 and tap{" "}
            <Text className="text-on-surface">Generate Link Code</Text>, then
            enter the 6-character code below.
          </Text>
        </View>

        {/* Form */}
        <View className="gap-4 px-6">
          <Input
            label="LINK CODE"
            placeholder="XXXXXX"
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            style={{ textAlign: "center", fontSize: 24, letterSpacing: 6 }}
          />

          {/* Auth error */}
          {authError && (
            <TextSM className="text-primary text-center">{authError}</TextSM>
          )}

          <Button
            variant="primary"
            size="lg"
            iconRight="link"
            className="mt-2 w-full"
            disabled={code.length !== 6 || loading}
            loading={loading}
            onPress={() => void handleSubmit()}
          >
            LINK ACCOUNT
          </Button>
        </View>
      </ScrollView>
    </StyledSafeAreaView>
  );
}
