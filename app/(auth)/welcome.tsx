import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
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
  TextLG,
} from "@/src/components/ui";

const HERO_IMAGE_URI =
  "https://d11n7da8rpqbjy.cloudfront.net/u346976/357_1743466712nAhDSC07234.jpg";
const PRIVACY_POLICY_URL = "https://www.hoop33.co.nz/privacypolicy";

const appVersion = Constants.expoConfig?.version ?? "1.0.0";

const styles = StyleSheet.create({
  vignetteTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "35%",
  },
  vignetteLeft: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "45%",
  },
  vignetteRight: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: "45%",
  },
  vignetteBottom: {
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
      {/* Subtle base tint */}
      <View className="absolute inset-0 bg-[rgba(0,0,0,0.15)]" />

      {/* Vignette — top */}
      <LinearGradient
        colors={["rgba(0,0,0,0.55)", "transparent"]}
        style={styles.vignetteTop}
      />

      {/* Vignette — left */}
      <LinearGradient
        colors={["rgba(0,0,0,0.6)", "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.vignetteLeft}
      />

      {/* Vignette — right */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.6)"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.vignetteRight}
      />

      {/* Vignette — bottom */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.88)", "#000"]}
        locations={[0, 0.35, 0.7, 1]}
        style={styles.vignetteBottom}
      />

      <StyledSafeAreaView className="flex-1 bg-transparent">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          bounces={false}
        >
          {/* Logo */}
          <View className="mb-auto items-center pt-5">
            <Image
              source={require("../../assets/logo-light.png")}
              style={{ width: 280, height: 84 }}
              resizeMode="contain"
            />
          </View>

          {/* Headline */}
          <View className="flex-1 items-center justify-start px-6 pt-4">
            <Heading1
              className="-mb-6 text-center italic"
              style={{ transform: [{ skewX: "-10deg" }] }}
            >
              ELEVATE
            </Heading1>
            <Heading1
              className="text-primary -mb-6 text-center italic"
              style={{ transform: [{ skewX: "-10deg" }] }}
            >
              YOUR
            </Heading1>
            <Heading1
              className="text-primary text-center italic"
              style={{ transform: [{ skewX: "-10deg" }] }}
            >
              GAME
            </Heading1>
          </View>

          {/* Stats */}
          <View className="flex-row gap-4 px-6 pt-6">
            <Card className="flex-1 items-center py-6">
              <Heading3 className="text-primary">500K+</Heading3>
              <Label className="text-on-surface-muted mt-1 text-center tracking-widest uppercase">
                Workouts{"\n"}Completed
              </Label>
            </Card>

            <Card className="flex-1 items-center py-6">
              <Heading3 className="text-brand-blue">33K+</Heading3>
              <Label className="text-on-surface-muted mt-1 text-center tracking-widest uppercase">
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
              <TextLG className="font-bold">Join the Elite</TextLG>
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
          <View className="items-center gap-2 px-6 pt-6 pb-8">
            <RNText
              style={{
                fontFamily: "Lexend_400Regular",
                fontSize: 12,
                color: "rgba(245,245,245,0.5)",
                textAlign: "center",
              }}
            >
              {/* <InlineButton
                onPress={() => {}}
              >
                Terms of Service
              </InlineButton>
              {"  •  "} */}
              <InlineButton
                onPress={() => {
                  void Linking.openURL(PRIVACY_POLICY_URL);
                }}
              >
                Privacy Policy
              </InlineButton>
            </RNText>
            <Label className="text-on-surface-faint text-center tracking-widest uppercase">
              Hoop 33 Training Systems • Ver {appVersion}
            </Label>
          </View>
        </ScrollView>
      </StyledSafeAreaView>
    </ImageBackground>
  );
}
