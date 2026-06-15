import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";

import { DashboardHeader } from "@/src/components/dashboard";
import { EyeIcon, XIcon } from "@/src/components/dashboard/icons";
import { colors } from "@/src/constants/theme";
import { roleConfig } from "@/src/constants/roles";
import { getChildProfile } from "@/src/services/parent.service";

const PLAYER = roleConfig("player");

/**
 * A read-only preview of a child's player experience. The parent stays signed
 * in as themselves — this renders the player dashboard with the child's
 * details so a guardian can see what their athlete sees, then exit.
 */
export default function ViewAsChildScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; firstName?: string }>();

  const [firstName, setFirstName] = useState(params.firstName ?? "");
  const [initials, setInitials] = useState(
    (params.firstName?.charAt(0) ?? "?").toUpperCase(),
  );

  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;
    getChildProfile(params.id).then((c) => {
      if (cancelled || !c) return;
      setFirstName(c.firstName);
      setInitials(
        (c.firstName.charAt(0) + c.lastName.charAt(0)).toUpperCase() || "?",
      );
    });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <LinearGradient
        colors={[PLAYER.headerTint, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.7 }}
        pointerEvents="none"
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 320 }}
      />
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <DashboardHeader
            role="player"
            firstName={firstName}
            initials={initials || "?"}
          />

          {/* Empty player dashboard preview */}
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 8,
              padding: 22,
              backgroundColor: colors.surface2,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              borderRadius: 18,
              alignItems: "center",
              gap: 8,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: `${PLAYER.accent}18`,
                borderWidth: 1,
                borderColor: `${PLAYER.accent}30`,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 4,
              }}
            >
              <EyeIcon size={20} color={PLAYER.accent} />
            </View>
            <Text
              style={{
                fontFamily: "Inter",
                fontSize: 15,
                fontWeight: "800",
                color: colors.textPrimary,
                textAlign: "center",
              }}
            >
              {firstName ? `${firstName}'s player view` : "Player view"}
            </Text>
            <Text
              style={{
                fontFamily: "Inter",
                fontSize: 13,
                color: colors.textSecondary,
                textAlign: "center",
                lineHeight: 19,
              }}
            >
              This is a read-only preview of what your athlete sees. Their
              training, schedule, and progress will appear here.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Floating "Viewing as" pill */}
      <SafeAreaView
        edges={["bottom"]}
        pointerEvents="box-none"
        style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
      >
        <View
          pointerEvents="box-none"
          style={{ alignItems: "center", paddingBottom: 24 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 9,
              paddingVertical: 8,
              paddingLeft: 14,
              paddingRight: 10,
              borderRadius: 999,
              backgroundColor: "#F68D68",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.45,
              shadowRadius: 22,
              elevation: 10,
            }}
          >
            <EyeIcon size={13} color="#3A1F12" />
            <Text
              style={{
                fontFamily: "Inter",
                fontSize: 12,
                fontWeight: "700",
                color: "#3A1F12",
                letterSpacing: -12 * 0.01,
              }}
            >
              Viewing as{" "}
              <Text style={{ fontWeight: "800" }}>
                {firstName || "athlete"}
              </Text>
            </Text>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Exit view as"
              hitSlop={8}
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: "#3A1F12",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <XIcon size={11} color="#FBD9C9" />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
