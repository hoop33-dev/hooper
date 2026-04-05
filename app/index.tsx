import { useState } from "react";
import { ScrollView, View, Text as RNText } from "react-native";
import { StyledSafeAreaView } from "@/src/lib/nativewind-interop";
import {
  Button,
  Card,
  Checkbox,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Icon,
  InlineButton,
  Input,
  Label,
  Pill,
  Radio,
  Text,
  TextLG,
  TextSM,
} from "@/src/components/ui";

export default function ShowcaseScreen() {
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(true);
  const [radioValue, setRadioValue] = useState<"a" | "b" | "c">("b");

  return (
    <StyledSafeAreaView className="bg-surface flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, gap: 40 }}
      >
        {/* ── Header ───────────────────────────────────────── */}
        <View>
          <Label className="text-primary mb-2 tracking-widest uppercase">
            Courtside Kinetic
          </Label>
          <Heading2>Design System</Heading2>
          <TextSM className="text-on-surface-muted mt-1">
            Component showcase — Hooper v1
          </TextSM>
        </View>

        {/* ── Typography ───────────────────────────────────── */}
        <Section title="Typography">
          <Heading1>Heading 1 — 48px</Heading1>
          <Heading2>Heading 2 — 36px</Heading2>
          <Heading3>Heading 3 — 24px</Heading3>
          <Heading4>Heading 4 — 20px</Heading4>
          <TextLG>TextLG — 18px body copy</TextLG>
          <Text>Text — 16px default body</Text>
          <TextSM>TextSM — 14px supporting text</TextSM>
          <Label className="tracking-widest uppercase">
            Label — 12px metadata
          </Label>
        </Section>

        {/* ── Buttons ──────────────────────────────────────── */}
        <Section title="Buttons">
          <Button variant="primary" onPress={() => {}}>
            <Text className="font-bold">Primary - Start drill</Text>
          </Button>
          <Button variant="secondary" onPress={() => {}}>
            Secondary — View Program
          </Button>
          <Button variant="inverted" onPress={() => {}}>
            Inverted — Cancel
          </Button>
          <Button variant="outline" onPress={() => {}}>
            Outline — Learn More
          </Button>
          <Button variant="primary" size="sm" onPress={() => {}}>
            Small Primary
          </Button>
          <Button variant="primary" size="lg" onPress={() => {}}>
            Large Primary
          </Button>
          <Button variant="primary" disabled onPress={() => {}}>
            Disabled
          </Button>

          {/* Icon variants */}
          <View className="flex-row flex-wrap gap-3">
            <Button variant="primary" iconLeft="basketball" onPress={() => {}}>
              Start Drill
            </Button>
            <Button
              variant="secondary"
              iconRight="chevron-forward"
              onPress={() => {}}
            >
              View Program
            </Button>
          </View>

          {/* Icon-only */}
          <View className="flex-row gap-3">
            <Button
              variant="primary"
              size="sm"
              iconLeft="add"
              onPress={() => {}}
            />
            <Button
              variant="secondary"
              size="md"
              iconLeft="search"
              onPress={() => {}}
            />
            <Button
              variant="outline"
              size="md"
              iconLeft="heart-outline"
              onPress={() => {}}
            />
            <Button
              variant="inverted"
              size="lg"
              iconLeft="share-outline"
              onPress={() => {}}
            />
          </View>
        </Section>

        {/* ── Inputs ───────────────────────────────────────── */}
        <Section title="Inputs">
          <Input
            leftIcon="search"
            placeholder="Search players, drills, programs…"
          />
          <Input
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Password"
            placeholder="Enter password"
            secureTextEntry
            error="Must be at least 8 characters"
          />
          <Input
            label="Username"
            placeholder="@handle"
            rightIcon="close-circle"
            onRightIconPress={() => {}}
          />
          <Input label="Disabled" placeholder="Cannot edit" disabled />
        </Section>

        {/* ── Selectors ────────────────────────────────────── */}
        <Section title="Selectors">
          <View className="gap-4">
            <Checkbox
              checked={checked1}
              onChange={setChecked1}
              label="Allow notifications"
            />
            <Checkbox
              checked={checked2}
              onChange={setChecked2}
              label="Remember me"
            />
            <Checkbox
              checked={false}
              onChange={() => {}}
              label="Disabled option"
              disabled
            />
          </View>

          <View className="bg-surface-highest mt-2 h-px" />

          <View className="gap-4">
            <Radio
              selected={radioValue === "a"}
              onSelect={() => setRadioValue("a")}
              label="Player — Youth athlete"
            />
            <Radio
              selected={radioValue === "b"}
              onSelect={() => setRadioValue("b")}
              label="Coach / Trainer"
            />
            <Radio
              selected={radioValue === "c"}
              onSelect={() => setRadioValue("c")}
              label="Organisation"
            />
            <Radio
              selected={false}
              onSelect={() => {}}
              label="Disabled option"
              disabled
            />
          </View>
        </Section>

        {/* ── Inline Buttons ───────────────────────────────── */}
        <Section title="Inline Buttons">
          <RNText
            style={{
              fontFamily: "Lexend_400Regular",
              fontSize: 16,
              lineHeight: 24,
              color: "#F5F5F5",
            }}
          >
            {"Want to join? "}
            <InlineButton onPress={() => {}}>Sign up now!</InlineButton>
          </RNText>
          <RNText
            style={{
              fontFamily: "Lexend_400Regular",
              fontSize: 16,
              lineHeight: 24,
              color: "#F5F5F5",
            }}
          >
            {"Already have an account? "}
            <InlineButton variant="secondary" onPress={() => {}}>
              Sign in
            </InlineButton>
          </RNText>
          <RNText
            style={{
              fontFamily: "Lexend_400Regular",
              fontSize: 14,
              lineHeight: 21,
              color: "rgba(245,245,245,0.5)",
            }}
          >
            {"By continuing you agree to our "}
            <InlineButton onPress={() => {}}>Terms of Service</InlineButton>
            {" and "}
            <InlineButton onPress={() => {}}>Privacy Policy</InlineButton>
            {"."}
          </RNText>
        </Section>

        {/* ── Pills ────────────────────────────────────────── */}
        <Section title="Pills">
          <View className="flex-row flex-wrap gap-2">
            <Pill variant="primary">+150 XP</Pill>
            <Pill variant="secondary">In Progress</Pill>
            <Pill variant="outline">Available</Pill>
            <Pill variant="inverted">Completed</Pill>
            <Pill variant="tertiary">Coach</Pill>
            <Pill variant="tertiary">Organisation</Pill>
            <Pill variant="primary" className="bg-primary-light-subtle">
              Custom
            </Pill>
          </View>
        </Section>

        {/* ── Cards ────────────────────────────────────────── */}
        <Section title="Cards">
          <Card>
            <Heading4>Training Program</Heading4>
            <TextSM className="text-on-surface-muted mt-1">
              Standard card — surface-container background, no border.
            </TextSM>
            <View className="mt-3 flex-row gap-2">
              <Pill variant="primary">+500 XP</Pill>
              <Pill variant="secondary">6 Drills</Pill>
            </View>
          </Card>

          <Card elevated className="mt-3">
            <Heading4>Elevated Card</Heading4>
            <TextSM className="text-on-surface-muted mt-1">
              Elevated — surface-high background with ambient shadow.
            </TextSM>
          </Card>

          <Card className="bg-navy mt-3">
            <Pill variant="tertiary" className="mb-2">
              Coach View
            </Pill>
            <Heading4>Coach-facing Card</Heading4>
            <TextSM className="text-on-surface-muted mt-1">
              Navy background via className override.
            </TextSM>
          </Card>
        </Section>

        {/* ── Icons ────────────────────────────────────────── */}
        <Section title="Icons (Ionicons)">
          <View className="flex-row flex-wrap gap-6">
            <View className="items-center gap-1">
              <Icon name="basketball" size="lg" color="primary" />
              <Label className="text-on-surface-muted">basketball</Label>
            </View>
            <View className="items-center gap-1">
              <Icon name="trophy" size="lg" color="primary" />
              <Label className="text-on-surface-muted">trophy</Label>
            </View>
            <View className="items-center gap-1">
              <Icon name="person-circle" size="lg" color="on-surface" />
              <Label className="text-on-surface-muted">person-circle</Label>
            </View>
            <View className="items-center gap-1">
              <Icon name="barbell" size="lg" color="brand-blue" />
              <Label className="text-on-surface-muted">barbell</Label>
            </View>
            <View className="items-center gap-1">
              <Icon name="star" size="lg" color="primary-light" />
              <Label className="text-on-surface-muted">star</Label>
            </View>
            <View className="items-center gap-1">
              <Icon name="lock-closed" size="lg" color="on-surface-muted" />
              <Label className="text-on-surface-muted">lock-closed</Label>
            </View>
            <View className="items-center gap-1">
              <Icon name="checkmark-circle" size="lg" color="primary" />
              <Label className="text-on-surface-muted">checkmark-circle</Label>
            </View>
            <View className="items-center gap-1">
              <Icon name="chevron-forward" size="md" color="on-surface" />
              <Label className="text-on-surface-muted">chevron-forward</Label>
            </View>
          </View>
        </Section>

        {/* ── Surface Palette ──────────────────────────────── */}
        <Section title="Surface Hierarchy">
          <View className="gap-2">
            {[
              { label: "surface", bg: "bg-surface", hex: "#161213" },
              { label: "surface-low", bg: "bg-surface-low", hex: "#1e1b1c" },
              {
                label: "surface-container",
                bg: "bg-surface-container",
                hex: "#252122",
              },
              { label: "surface-high", bg: "bg-surface-high", hex: "#2e2b2c" },
              {
                label: "surface-highest",
                bg: "bg-surface-highest",
                hex: "#383435",
              },
            ].map(({ label, bg, hex }) => (
              <View
                key={label}
                className={`${bg} flex-row items-center justify-between rounded-xl px-4 py-3`}
              >
                <Label>{label}</Label>
                <Label className="text-on-surface-muted">{hex}</Label>
              </View>
            ))}
          </View>
        </Section>

        <View className="h-8" />
      </ScrollView>
    </StyledSafeAreaView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View>
      <View className="mb-4 flex-row items-center gap-3">
        <Heading3>{title}</Heading3>
        <View className="bg-surface-highest h-px flex-1" />
      </View>
      <View className="gap-3">{children}</View>
    </View>
  );
}
