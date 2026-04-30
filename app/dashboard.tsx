import { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { styled } from "nativewind";

import { supabase } from "@/src/lib/supabase";
import { signOut } from "@/src/services/auth.service";
import { ROLES } from "@/src/constants/roles";
import type { RoleId } from "@/src/constants/roles";

const StyledSafeAreaView = styled(SafeAreaView);

type UserInfo = {
  firstName: string;
  lastName: string;
  username: string;
  role: RoleId;
};

export default function DashboardScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata;
      if (!meta) return;
      setUser({
        firstName: meta.first_name ?? "",
        lastName: meta.last_name ?? "",
        username: meta.username ?? "",
        role: (meta.role ?? "player") as RoleId,
      });
    });
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.replace("/");
  }

  const roleConfig = user
    ? (ROLES.find((r) => r.id === user.role) ?? ROLES[0])
    : null;

  return (
    <StyledSafeAreaView className="bg-surface flex-1" edges={["top", "bottom"]}>
      <View className="flex-1 px-6 pt-8">
        {/* Temporary label */}
        <Text
          style={{
            fontFamily: "Inter",
            fontSize: 10,
            fontWeight: "500",
            letterSpacing: 10 * 0.14,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.25)",
            marginBottom: 32,
          }}
        >
          Temporary dashboard
        </Text>

        {!user ? (
          <ActivityIndicator color="#F15825" style={{ marginTop: 40 }} />
        ) : (
          <View style={{ gap: 24 }}>
            {/* Name */}
            <View style={{ gap: 4 }}>
              <Text
                style={{
                  fontFamily: "Inter",
                  fontSize: 10,
                  fontWeight: "500",
                  letterSpacing: 10 * 0.12,
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                Name
              </Text>
              <Text
                style={{
                  fontFamily: "Inter",
                  fontWeight: "800",
                  fontSize: 32,
                  letterSpacing: 32 * -0.03,
                  lineHeight: 32 * 1.1,
                  color: "#FFFFFF",
                }}
              >
                {user.firstName} {user.lastName}
              </Text>
              {user.username ? (
                <Text
                  style={{
                    fontFamily: "Inter",
                    fontSize: 14,
                    color: "rgba(255,255,255,0.45)",
                  }}
                >
                  @{user.username}
                </Text>
              ) : null}
            </View>

            {/* Role */}
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  fontFamily: "Inter",
                  fontSize: 10,
                  fontWeight: "500",
                  letterSpacing: 10 * 0.12,
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                Role
              </Text>
              <View
                style={{
                  alignSelf: "flex-start",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 9999,
                  backgroundColor: roleConfig?.accentDim,
                  borderWidth: 1,
                  borderColor: roleConfig?.accentBorder,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter",
                    fontWeight: "700",
                    fontSize: 13,
                    letterSpacing: 13 * 0.04,
                    color: roleConfig?.accent,
                  }}
                >
                  {roleConfig?.title}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Sign out */}
      <View className="px-6 pb-4">
        <Pressable
          onPress={handleSignOut}
          disabled={signingOut}
          style={({ pressed }) => ({
            height: 52,
            borderRadius: 9999,
            backgroundColor: "transparent",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.16)",
            alignItems: "center",
            justifyContent: "center",
            opacity: signingOut ? 0.6 : pressed ? 0.7 : 1,
            transform: [{ scale: pressed && !signingOut ? 0.97 : 1 }],
          })}
        >
          {signingOut ? (
            <ActivityIndicator color="rgba(255,255,255,0.6)" />
          ) : (
            <Text
              style={{
                fontFamily: "Inter",
                fontWeight: "700",
                fontSize: 15,
                letterSpacing: 15 * 0.08,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.65)",
              }}
            >
              Sign out
            </Text>
          )}
        </Pressable>
      </View>
    </StyledSafeAreaView>
  );
}
