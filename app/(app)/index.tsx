import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { StyledSafeAreaView } from "@/src/lib/nativewind-interop";
import { Button, Heading3, Label, Text } from "@/src/components/ui";
import { generateLinkCode } from "@/src/services/auth.service";
import { getSupabaseClient } from "@/src/lib/supabase";

export default function AppHome() {
  const router = useRouter();
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  async function handleLogOut() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/(auth)/welcome");
  }

  async function handleGenerateCode() {
    setLinkLoading(true);
    setLinkError(null);
    try {
      const code = await generateLinkCode();
      setLinkCode(code);
    } catch (error) {
      setLinkError(
        error instanceof Error ? error.message : "Failed to generate code.",
      );
    } finally {
      setLinkLoading(false);
    }
  }

  return (
    <StyledSafeAreaView className="bg-surface flex-1">
      <View className="flex-1 items-center justify-center gap-6 px-6">
        <Text className="text-on-surface-muted">Welcome to Hoop 33</Text>

        <Button
          variant="outline"
          iconLeft="link"
          loading={linkLoading}
          onPress={() => void handleGenerateCode()}
        >
          Generate Link Code
        </Button>

        {linkCode && (
          <View className="items-center gap-2">
            <Label className="text-on-surface-muted">
              Share this code with your child — expires in 48 hours
            </Label>
            <Heading3 className="text-primary" style={{ letterSpacing: 6 }}>
              {linkCode}
            </Heading3>
          </View>
        )}

        {linkError && (
          <Text className="text-primary text-center">{linkError}</Text>
        )}

        <Button
          variant="outline"
          iconLeft="log-out"
          onPress={() => void handleLogOut()}
        >
          Log Out
        </Button>
      </View>
    </StyledSafeAreaView>
  );
}
