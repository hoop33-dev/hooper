import { useEffect, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { StyledSafeAreaView } from "@/src/lib/nativewind-interop";
import { Button, Heading3, Label, Text } from "@/src/components/ui";
import { generateLinkCode } from "@/src/services/auth.service";
import { getSupabaseClient } from "@/src/lib/supabase";

function getAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export default function AppHome() {
  const router = useRouter();
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isUnder16, setIsUnder16] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("date_of_birth")
        .eq("id", user.id)
        .single();

      if (profile?.date_of_birth) {
        setIsUnder16(getAge(new Date(profile.date_of_birth)) < 16);
      }
    }
    void loadProfile();
  }, []);

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

        {!isUnder16 && (
          <Button
            variant="outline"
            iconRight="link"
            loading={linkLoading}
            onPress={() => void handleGenerateCode()}
          >
            Generate Link Code
          </Button>
        )}

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
          iconRight="log-out"
          onPress={() => void handleLogOut()}
        >
          Log Out
        </Button>
      </View>
    </StyledSafeAreaView>
  );
}
