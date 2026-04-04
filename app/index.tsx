import { ScrollView, View } from "react-native";
import { StyledSafeAreaView } from "@/src/lib/nativewind-interop";
import {
  Button,
  Card,
  Header1,
  Header2,
  Header3,
  Header4,
  Icon,
  Label,
  Pill,
  Text,
  TextLG,
  TextSM,
} from "@/src/components/ui";

export default function ShowcaseScreen() {
  return (
    <StyledSafeAreaView className="bg-surface flex-1">
      <ScrollView className="flex-1" contentContainerClassName="p-6 gap-10">
        {/* ── Header ───────────────────────────────────────── */}
        <View>
          <Label className="text-primary mb-2 tracking-widest uppercase">
            Courtside Kinetic
          </Label>
          <Header2>Design System</Header2>
          <TextSM className="text-on-surface/50 mt-1">
            Component showcase — Hooper v1
          </TextSM>
        </View>

        {/* ── Typography ───────────────────────────────────── */}
        <Section title="Typography">
          <Header1>Header 1 — 48px</Header1>
          <Header2>Header 2 — 36px</Header2>
          <Header3>Header 3 — 24px</Header3>
          <Header4>Header 4 — 20px</Header4>
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
            Primary — Start Drill
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
            <Pill variant="primary" className="bg-primary-light/20">
              Custom
            </Pill>
          </View>
        </Section>

        {/* ── Cards ────────────────────────────────────────── */}
        <Section title="Cards">
          <Card>
            <Header4>Training Program</Header4>
            <TextSM className="text-on-surface/50 mt-1">
              Standard card — surface-container background, no border.
            </TextSM>
            <View className="mt-3 flex-row gap-2">
              <Pill variant="primary">+500 XP</Pill>
              <Pill variant="secondary">6 Drills</Pill>
            </View>
          </Card>

          <Card elevated className="mt-3">
            <Header4>Elevated Card</Header4>
            <TextSM className="text-on-surface/50 mt-1">
              Elevated — surface-high background with ambient shadow.
            </TextSM>
          </Card>

          <Card className="bg-navy mt-3">
            <Pill variant="tertiary" className="mb-2">
              Coach View
            </Pill>
            <Header4>Coach-facing Card</Header4>
            <TextSM className="text-on-surface/50 mt-1">
              Navy background via className override.
            </TextSM>
          </Card>
        </Section>

        {/* ── Icons ────────────────────────────────────────── */}
        <Section title="Icons (Ionicons)">
          <View className="flex-row flex-wrap gap-6">
            <View className="items-center gap-1">
              <Icon name="basketball" size="lg" color="primary" />
              <Label className="text-on-surface/50">basketball</Label>
            </View>
            <View className="items-center gap-1">
              <Icon name="trophy" size="lg" color="primary" />
              <Label className="text-on-surface/50">trophy</Label>
            </View>
            <View className="items-center gap-1">
              <Icon name="person-circle" size="lg" color="on-surface" />
              <Label className="text-on-surface/50">person-circle</Label>
            </View>
            <View className="items-center gap-1">
              <Icon name="barbell" size="lg" color="brand-blue" />
              <Label className="text-on-surface/50">barbell</Label>
            </View>
            <View className="items-center gap-1">
              <Icon name="star" size="lg" color="primary-light" />
              <Label className="text-on-surface/50">star</Label>
            </View>
            <View className="items-center gap-1">
              <Icon name="lock-closed" size="lg" color="on-surface-muted" />
              <Label className="text-on-surface/50">lock-closed</Label>
            </View>
            <View className="items-center gap-1">
              <Icon name="checkmark-circle" size="lg" color="primary" />
              <Label className="text-on-surface/50">checkmark-circle</Label>
            </View>
            <View className="items-center gap-1">
              <Icon name="chevron-forward" size="md" color="on-surface" />
              <Label className="text-on-surface/50">chevron-forward</Label>
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
                <Label className="text-on-surface/40">{hex}</Label>
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
        <Header3>{title}</Header3>
        <View className="bg-surface-highest h-px flex-1" />
      </View>
      <View className="gap-3">{children}</View>
    </View>
  );
}
