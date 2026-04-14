import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { getSupabaseClient, getSupabaseConfigError } from "@/src/lib/supabase";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    if (getSupabaseConfigError()) {
      router.replace("/(auth)/welcome");
      return;
    }

    const supabase = getSupabaseClient();

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/(auth)/welcome");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_locked")
        .eq("id", session.user.id)
        .single();

      router.replace(profile?.is_locked ? "/(app)/locked" : "/(app)");
    })();
  }, [router]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#161213",
      }}
    >
      <ActivityIndicator color="#F26522" />
    </View>
  );
}
