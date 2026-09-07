import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { styled } from "nativewind";
import { type ReactNode } from "react";
import { ImageBackground, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  CoachConnectIllustration,
  CourtIllustration,
  ProgressIllustration,
} from "@/src/components/splash/illustrations";
import { Body, Button, Carousel, H2, Label, Logo } from "@/src/components/ui";

const StyledImageBackground = styled(ImageBackground);
const StyledSafeAreaView = styled(SafeAreaView);

const HERO_IMAGE_URI =
  "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=900&q=80";

type Slide = {
  id: string;
  label: string;
  headline: string;
  body: string;
  illustration: ReactNode;
};

const SLIDES: Slide[] = [
  {
    id: "train-smart",
    label: "Train smart",
    headline: "Your court.\nYour rules.",
    body: "Structured programs built by your coach — delivered straight to your pocket.",
    illustration: <CourtIllustration />,
  },
  {
    id: "coach-connect",
    label: "Coach connect",
    headline: "Your team.\nYour programs.",
    body: "Coaches build, assign, and track. Athletes execute. The loop closes in real time.",
    illustration: <CoachConnectIllustration />,
  },
  {
    id: "track-progress",
    label: "Track progress",
    headline: "Numbers\ndon't lie.",
    body: "Every set, every rep, every session — logged and visualised so you can see the gains.",
    illustration: <ProgressIllustration />,
  },
];

export default function SplashScreen() {
  const router = useRouter();

  return (
    <StyledImageBackground
      source={{ uri: HERO_IMAGE_URI }}
      resizeMode="cover"
      className="bg-surface flex-1">
      <LinearGradient
        colors={[
          "rgba(26,23,24,0.55)",
          "rgba(26,23,24,0.30)",
          "rgba(26,23,24,0.70)",
          "rgba(26,23,24,0.97)",
        ]}
        locations={[0, 0.35, 0.65, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <StyledSafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="items-center pt-2 pb-2">
          <Logo height={85} />
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <Carousel
            items={SLIDES}
            autoAdvanceMs={6000}
            renderItem={(slide) => (
              <View className="items-center">
                <View className="mb-5 h-[140px] w-[200px]">
                  {slide.illustration}
                </View>

                <Label className="text-brand-orange mb-2.5">
                  {slide.label}
                </Label>

                <H2 className="mb-3.5 text-center">{slide.headline}</H2>

                <Body className="max-w-[280px] text-center">{slide.body}</Body>
              </View>
            )}
          />
        </View>

        <View className="gap-3 px-6 pb-6">
          <Button
            variant="primary"
            size="lg"
            className="shadow-orange-glow w-full"
            onPress={() => router.push("/(auth)/role-selector")}>
            Create account
          </Button>

          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onPress={() => router.push("/(auth)/login")}>
            Sign in
          </Button>
        </View>
      </StyledSafeAreaView>
    </StyledImageBackground>
  );
}
