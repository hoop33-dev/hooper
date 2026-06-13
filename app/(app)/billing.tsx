import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";

import {
  CheckIcon,
  ChevronIcon,
  CreditIcon,
} from "@/src/components/dashboard/icons";
import { colors } from "@/src/constants/theme";
import { roleConfig } from "@/src/constants/roles";
import { useDashboardUser } from "@/src/hooks/useDashboardUser";

type Frequency = "monthly" | "yearly";

type Feature = { has: boolean; text: string; emphasis?: boolean };

const TIERS: {
  tierNum: 1 | 2;
  name: string;
  tagline: string;
  recommended?: boolean;
  features: Feature[];
}[] = [
  {
    tierNum: 1,
    name: "Standard",
    tagline: "Train on your own terms.",
    features: [
      { has: true, text: "Standard training & curriculum" },
      { has: true, text: "Standard training programs" },
      { has: true, text: "Build your own programs" },
      { has: true, text: "Log activities & stats, upload videos" },
      { has: false, text: "Access to a coach" },
      { has: false, text: "Personalised coach-driven programs" },
    ],
  },
  {
    tierNum: 2,
    name: "Coached",
    tagline: "Work 1:1 with a Hooper coach.",
    recommended: true,
    features: [
      { has: true, text: "Everything in Standard", emphasis: true },
      { has: true, text: "Access to one or more coaches" },
      { has: true, text: "Personalised basketball training" },
      { has: true, text: "Personalised strength & conditioning" },
      { has: true, text: "Private training sessions" },
      { has: true, text: "Regular reassessments & feedback" },
      { has: false, text: "Free admission into events" },
    ],
  },
];

/* ─── Sub-components ───────────────────────────────────────── */

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Back"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 16,
        alignSelf: "flex-start",
      }}
    >
      <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
        <Path
          d="M10 3L5 8L10 13"
          stroke={colors.textTertiary}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text
        style={{
          fontFamily: "Inter",
          fontSize: 13,
          fontWeight: "500",
          color: colors.textTertiary,
        }}
      >
        Profile
      </Text>
    </Pressable>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontFamily: "Inter",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 11 * 0.13,
        textTransform: "uppercase",
        color: colors.textSecondary,
        marginTop: 28,
        marginBottom: 12,
      }}
    >
      {children}
    </Text>
  );
}

function FrequencyToggle({
  value,
  onChange,
  accent,
}: {
  value: Frequency;
  onChange: (f: Frequency) => void;
  accent: string;
}) {
  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 4,
        backgroundColor: colors.surface2,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        borderRadius: 999,
        flexDirection: "row",
      }}
    >
      {(["monthly", "yearly"] as Frequency[]).map((f) => {
        const active = value === f;
        return (
          <Pressable
            key={f}
            onPress={() => onChange(f)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              flex: 1,
              height: 38,
              backgroundColor: active ? accent : "transparent",
              borderRadius: 9999,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter",
                fontSize: 13,
                fontWeight: "700",
                letterSpacing: 13 * 0.02,
                textTransform: "capitalize",
                color: active ? "#fff" : colors.textSecondary,
              }}
            >
              {f}
            </Text>
            {f === "yearly" && !active ? (
              <View
                style={{
                  backgroundColor: "rgba(56,161,105,0.18)",
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter",
                    fontSize: 9,
                    fontWeight: "800",
                    letterSpacing: 9 * 0.1,
                    color: colors.success,
                  }}
                >
                  SAVE
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function FeatureRow({ feature, accent }: { feature: Feature; accent: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        opacity: feature.has ? 1 : 0.4,
      }}
    >
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: feature.has
            ? `${accent}20`
            : "rgba(255,255,255,0.06)",
          borderWidth: 1,
          borderColor: feature.has ? `${accent}40` : colors.borderSubtle,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 1,
          flexShrink: 0,
        }}
      >
        {feature.has ? (
          <CheckIcon size={10} color={accent} />
        ) : (
          <Svg width={8} height={8} viewBox="0 0 8 8" fill="none">
            <Path
              d="M1 1L7 7M7 1L1 7"
              stroke={colors.textTertiary}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </Svg>
        )}
      </View>
      <Text
        style={{
          flex: 1,
          fontFamily: "Inter",
          fontSize: 13,
          lineHeight: 18,
          fontWeight: feature.emphasis ? "700" : "400",
          color: feature.has
            ? feature.emphasis
              ? "#fff"
              : colors.textPrimary
            : colors.textTertiary,
        }}
      >
        {feature.text}
      </Text>
    </View>
  );
}

function TierCard({
  tier,
  frequency,
  accent,
  selected,
  current,
  onSelect,
}: {
  tier: (typeof TIERS)[number];
  frequency: Frequency;
  accent: string;
  selected: boolean;
  current: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{
        position: "relative",
        backgroundColor: colors.surface2,
        borderWidth: 1.5,
        borderColor: selected ? accent : colors.borderSubtle,
        borderRadius: 18,
        padding: 18,
        paddingBottom: 16,
        overflow: "hidden",
        shadowColor: selected ? accent : "#000",
        shadowOffset: { width: 0, height: selected ? 6 : 2 },
        shadowOpacity: selected ? 0.22 : 0.25,
        shadowRadius: selected ? 24 : 8,
        elevation: selected ? 8 : 2,
      }}
    >
      {selected ? (
        <LinearGradient
          colors={[`${accent}12`, colors.surface2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.6 }}
          pointerEvents="none"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
      ) : null}

      {tier.recommended ? (
        <View
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            paddingHorizontal: 9,
            paddingVertical: 4,
            backgroundColor: accent,
            borderRadius: 999,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 9,
              fontWeight: "800",
              letterSpacing: 9 * 0.14,
              color: "#fff",
              textTransform: "uppercase",
            }}
          >
            Recommended
          </Text>
        </View>
      ) : null}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <Text
          style={{
            fontFamily: "Inter",
            fontSize: 9.5,
            fontWeight: "700",
            letterSpacing: 9.5 * 0.14,
            color: accent,
            textTransform: "uppercase",
          }}
        >
          Level {tier.tierNum}
        </Text>
        {current ? (
          <View
            style={{
              backgroundColor: "rgba(56,161,105,0.14)",
              borderWidth: 1,
              borderColor: "rgba(56,161,105,0.3)",
              paddingHorizontal: 7,
              paddingVertical: 2,
              borderRadius: 999,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter",
                fontSize: 9,
                fontWeight: "700",
                letterSpacing: 9 * 0.12,
                color: colors.success,
                textTransform: "uppercase",
              }}
            >
              Current
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        style={{
          fontFamily: "Inter",
          fontSize: 22,
          fontWeight: "900",
          color: "#fff",
          letterSpacing: -22 * 0.03,
          marginBottom: 4,
        }}
      >
        {tier.name}
      </Text>
      <Text
        style={{
          fontFamily: "Inter",
          fontSize: 13,
          color: colors.textSecondary,
          marginBottom: 16,
        }}
      >
        {tier.tagline}
      </Text>

      {/* Price */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          gap: 6,
          marginBottom: 18,
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: "rgba(255,255,255,0.03)",
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          borderRadius: 12,
        }}
      >
        <Text
          style={{
            fontFamily: "Inter",
            fontSize: 24,
            fontWeight: "900",
            color: "#fff",
            letterSpacing: -24 * 0.03,
          }}
        >
          TBA
        </Text>
        <Text
          style={{
            fontFamily: "Inter",
            fontSize: 12,
            color: colors.textTertiary,
          }}
        >
          · {frequency === "monthly" ? "per month" : "per year"}
        </Text>
        <View
          style={{
            marginLeft: "auto",
            paddingHorizontal: 7,
            paddingVertical: 3,
            backgroundColor: "rgba(255,255,255,0.05)",
            borderRadius: 4,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 10,
              fontWeight: "600",
              letterSpacing: 10 * 0.06,
              color: colors.textTertiary,
            }}
          >
            PRICING TBD
          </Text>
        </View>
      </View>

      {/* Features */}
      <View style={{ gap: 9 }}>
        {tier.features.map((f, i) => (
          <FeatureRow key={i} feature={f} accent={accent} />
        ))}
      </View>
    </Pressable>
  );
}

function PaymentMethodRow({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: colors.surface2,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        borderRadius: 14,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          backgroundColor: "rgba(255,255,255,0.04)",
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <CreditIcon size={18} color={colors.textSecondary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontFamily: "Inter",
            fontSize: 13.5,
            fontWeight: "600",
            color: colors.textSecondary,
          }}
        >
          Add payment method
        </Text>
        <Text
          style={{
            fontFamily: "Inter",
            fontSize: 11.5,
            color: colors.textTertiary,
          }}
        >
          Card, Apple Pay, Google Pay
        </Text>
      </View>
      <ChevronIcon size={16} color={colors.textTertiary} />
    </Pressable>
  );
}

/* ─── Main screen ──────────────────────────────────────────── */

export default function BillingScreen() {
  const router = useRouter();
  const user = useDashboardUser();
  const role = user?.role ?? "player";
  const r = roleConfig(role);

  // Current tier depends on role — parent has Level 2 (covers coach access for
  // their athlete), everyone else defaults to Level 1.
  const currentTier: 1 | 2 = role === "parent" ? 2 : 1;
  const [selected, setSelected] = useState<1 | 2>(currentTier);
  const [frequency, setFrequency] = useState<Frequency>("monthly");

  const isCurrent = selected === currentTier;
  const ctaLabel = isCurrent
    ? "Current plan"
    : `${selected > currentTier ? "Upgrade to " : "Switch to "}${
        selected === 2 ? "Coached" : "Standard"
      }`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <LinearGradient
        colors={[r.headerTint, "transparent"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200 }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{ paddingHorizontal: 20, paddingTop: 58, paddingBottom: 20 }}
        >
          <BackButton onPress={() => router.back()} />
          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 26,
              fontWeight: "900",
              color: colors.textPrimary,
              letterSpacing: -26 * 0.03,
            }}
          >
            Subscription
          </Text>
        </View>

        <FrequencyToggle
          value={frequency}
          onChange={setFrequency}
          accent={r.accent}
        />

        {/* Tier cards */}
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {TIERS.map((tier) => (
            <TierCard
              key={tier.tierNum}
              tier={tier}
              frequency={frequency}
              accent={r.accent}
              selected={selected === tier.tierNum}
              current={currentTier === tier.tierNum}
              onSelect={() => setSelected(tier.tierNum)}
            />
          ))}
        </View>

        {/* Billing details */}
        <View style={{ paddingHorizontal: 20 }}>
          <SectionLabel>Billing details</SectionLabel>
          <PaymentMethodRow />
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingBottom: 36,
          paddingTop: 12,
        }}
        pointerEvents="box-none"
      >
        <LinearGradient
          colors={["transparent", colors.surface]}
          style={{
            position: "absolute",
            top: -20,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          pointerEvents="none"
        />
        <Pressable
          accessibilityRole="button"
          disabled={isCurrent}
          style={{
            height: 52,
            borderRadius: 9999,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isCurrent ? "transparent" : r.accent,
            borderWidth: isCurrent ? 1.5 : 0,
            borderColor: colors.borderStrong,
            shadowColor: r.accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: isCurrent ? 0 : 0.45,
            shadowRadius: 16,
            elevation: isCurrent ? 0 : 6,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 15,
              fontWeight: "700",
              color: isCurrent ? colors.textSecondary : "#fff",
            }}
          >
            {ctaLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
