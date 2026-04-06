import { Image, ImageBackground, ScrollView, StyleSheet, Text as RNText, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { StyledSafeAreaView } from "@/src/lib/nativewind-interop";
import {
  Button,
  Card,
  Heading1,
  Heading3,
  InlineButton,
  Label,
} from "@/src/components/ui";

const HERO_IMAGE_URI =
  "https://d11n7da8rpqbjy.cloudfront.net/u346976/112833684965Jay.jpg";

const appVersion = Constants.expoConfig?.version ?? "1.0.0";

const styles = StyleSheet.create({
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "65%",
  },
});

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <ImageBackground
      source={{ uri: HERO_IMAGE_URI }}
      resizeMode="cover"
      style={{ flex: 1 }}
    >
      {/* Dark overlay — covers full screen */}
      <View className="absolute inset-0 bg-[rgba(22,18,19,0.45)]" />

      {/* Bottom vignette gradient */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.85)", "#000"]}
        locations={[0, 0.35, 0.7, 1]}
        style={styles.bottomGradient}
      />

      <StyledSafeAreaView className="flex-1 bg-transparent">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          bounces={false}
        >
          {/* Logo */}
          <View className="items-center pt-12">
            <Image
              source={require("../../assets/logo-light.png")}
              style={{ width: 280, height: 84 }}
              resizeMode="contain"
            />
          </View>

          {/* Headline */}
          <View className="flex-1 items-center justify-center px-6 pb-12 pt-8">
            <Heading1 className="text-center">ELEVATE</Heading1>
            <Heading1 className="text-center text-primary">YOUR</Heading1>
            <Heading1 className="text-center text-primary">GAME</Heading1>
          </View>

          {/* Stats */}
          <View className="flex-row gap-4 px-6 pt-6">
            <Card className="flex-1 items-center py-6">
              <Heading3 className="text-primary">500K+</Heading3>
              <Label className="mt-1 text-center uppercase tracking-widest text-on-surface-muted">
                Workouts{"\n"}Completed
              </Label>
            </Card>

            <Card className="flex-1 items-center py-6">
              <Heading3 className="text-brand-blue">33K+</Heading3>
              <Label className="mt-1 text-center uppercase tracking-widest text-on-surface-muted">
                Elite{"\n"}Ballers
              </Label>
            </Card>
          </View>

          {/* CTAs */}
          <View className="gap-3 px-6 pt-6">
            <Button
              variant="primary"
              size="lg"
              iconRight="flash-outline"
              className="w-full"
              onPress={() => router.push("/(auth)/register")}
            >
              Join the Elite
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onPress={() => router.push("/(auth)/login")}
            >
              Sign In
            </Button>
          </View>

          {/* Footer */}
          <View className="items-center gap-2 px-6 pb-8 pt-6">
            <RNText
              style={{
                fontFamily: "Lexend_400Regular",
                fontSize: 12,
                color: "rgba(245,245,245,0.5)",
                textAlign: "center",
              }}
            >
              <InlineButton onPress={() => {}}>Terms of Service</InlineButton>
              {"  •  "}
              <InlineButton onPress={() => {}}>Privacy Policy</InlineButton>
            </RNText>
            <Label className="uppercase tracking-widest text-on-surface-faint text-center">
              Hoop 33 Training Systems • Ver {appVersion}
            </Label>
          </View>
        </ScrollView>
      </StyledSafeAreaView>
    </ImageBackground>
  );
}
