import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Badge,
  Body,
  BodySm,
  Button,
  Card,
  Carousel,
  H1,
  H2,
  H3,
  H4,
  Input,
  Label,
  Logo,
  NumberBadge,
  Stat,
  Tag,
  TextButton,
} from "@/src/components/ui";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-3">
      <Label>{title}</Label>
      {children}
    </View>
  );
}

export default function DesignSystem() {
  const router = useRouter();

  return (
    <SafeAreaView className="bg-surface flex-1" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 28 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <View>
            <H3>Design system</H3>
            <BodySm className="mt-0.5">Hooper component library</BodySm>
          </View>
          <TextButton onPress={() => router.back()} tone="brand">
            Back
          </TextButton>
        </View>

        {/* Logo */}
        <Section title="Logo">
          <Card>
            <View className="items-center py-2">
              <Logo height={56} />
            </View>
          </Card>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <Card>
            <View className="gap-3">
              <H1>Display H1</H1>
              <H2>Section H2</H2>
              <H3>Card H3</H3>
              <H4>Sub-heading H4</H4>
              <Body>
                Body text — Hooper connects athletes and coaches on one platform
                built for serious training.
              </Body>
              <BodySm>Body sm — secondary supporting text.</BodySm>
              <Label>Label / caps</Label>
              <Stat>33</Stat>
            </View>
          </Card>
        </Section>

        {/* Colors */}
        <Section title="Brand colors">
          <View className="flex-row flex-wrap gap-2">
            {[
              { c: "bg-brand-orange", name: "brand-orange" },
              { c: "bg-brand-light-orange", name: "brand-light-orange" },
              { c: "bg-brand-navy", name: "brand-navy" },
              { c: "bg-brand-blue", name: "brand-blue" },
              { c: "bg-brand-black", name: "brand-black" },
              { c: "bg-brand-white", name: "brand-white" },
            ].map((s) => (
              <View key={s.name} className="items-center" style={{ width: 88 }}>
                <View
                  className={`border-border-subtle mb-1.5 h-12 w-full rounded-md border ${s.c}`}
                />
                <BodySm style={{ fontSize: 10 }}>{s.name}</BodySm>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Surfaces">
          <View className="flex-row gap-2">
            {[
              { c: "bg-surface", name: "surface" },
              { c: "bg-surface-2", name: "surface-2" },
              { c: "bg-surface-3", name: "surface-3" },
            ].map((s) => (
              <View key={s.name} className="flex-1 items-center">
                <View
                  className={`border-border-subtle mb-1.5 h-12 w-full rounded-md border ${s.c}`}
                />
                <BodySm style={{ fontSize: 10 }}>{s.name}</BodySm>
              </View>
            ))}
          </View>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <View className="gap-3">
            <Button variant="primary">Start session</Button>
            <Button variant="secondary">View program</Button>
            <Button variant="navy">Coach view</Button>
            <Button variant="ghost">Log set</Button>
            <View className="flex-row gap-2">
              <Button variant="primary" size="sm">
                Add
              </Button>
              <Button variant="primary" disabled>
                Unavailable
              </Button>
              <Button variant="icon" />
            </View>
            <Button variant="primary" className="shadow-orange-glow">
              With orange glow
            </Button>
          </View>
        </Section>

        {/* Text Buttons */}
        <Section title="Text buttons">
          <Card>
            <View className="gap-3">
              <View className="flex-row items-center gap-3">
                <BodySm>Don&apos;t have an account?</BodySm>
                <TextButton onPress={() => {}}>Sign up</TextButton>
              </View>
              <View className="flex-row items-center gap-3">
                <BodySm>Read our</BodySm>
                <TextButton tone="muted" underline onPress={() => {}}>
                  Privacy Policy
                </TextButton>
              </View>
              <View className="flex-row items-center gap-3">
                <BodySm>Need help?</BodySm>
                <TextButton tone="interactive" onPress={() => {}}>
                  Contact support
                </TextButton>
              </View>
            </View>
          </Card>
        </Section>

        {/* Badges & Tags */}
        <Section title="Badges & tags">
          <Card>
            <View className="flex-row flex-wrap items-center gap-2">
              <Badge variant="orange" dot>
                Active
              </Badge>
              <Badge variant="green" dot>
                Complete
              </Badge>
              <Badge variant="red" dot>
                Missed
              </Badge>
              <Badge variant="navy">Coach</Badge>
              <Badge variant="white">Athlete</Badge>
              <Badge variant="outline">Week 2</Badge>
              <Tag>Strength</Tag>
              <Tag>Upper Body</Tag>
              <Tag>Conditioning</Tag>
              <NumberBadge count={3} />
            </View>
          </Card>
        </Section>

        {/* Cards */}
        <Section title="Cards">
          <Card variant="accent">
            <View className="flex-row items-start justify-between">
              <View>
                <H4>Strength Block A</H4>
                <BodySm className="mt-1">
                  Assigned by Coach Marcus · Week 2 of 6
                </BodySm>
              </View>
              <Badge variant="orange" dot>
                Active
              </Badge>
            </View>
            <View className="mt-4 flex-row gap-4">
              {[
                { v: "4", l: "Days/Week" },
                { v: "12", l: "Exercises" },
                { v: "67%", l: "Complete" },
              ].map((s) => (
                <View key={s.l}>
                  <Stat style={{ fontSize: 22 }}>{s.v}</Stat>
                  <Label className="mt-1" style={{ fontSize: 9 }}>
                    {s.l}
                  </Label>
                </View>
              ))}
            </View>
          </Card>

          <Card variant="navy">
            <Label className="text-white/50">Coach</Label>
            <H4 className="mt-1">Marcus J.</H4>
            <BodySm className="mt-1.5 text-white/65">
              6 athletes · 3 active programs
            </BodySm>
          </Card>

          <Card>
            <H4>Default card</H4>
            <BodySm className="mt-1">
              Surface 2 background with subtle border.
            </BodySm>
          </Card>
        </Section>

        {/* Inputs */}
        <Section title="Form inputs">
          <Card>
            <View className="gap-4">
              <Input label="Email" placeholder="coach@hooper.app" />
              <Input
                label="Sets"
                defaultValue="3"
                hint="Active focus state"
                keyboardType="numeric"
              />
              <Input
                label="Reps"
                defaultValue="abc"
                error="Reps must be a number"
              />
              <View className="flex-row gap-3">
                <Input
                  label="Weight (kg)"
                  placeholder="80"
                  className="flex-1"
                  keyboardType="numeric"
                />
                <Input
                  label="Rest (sec)"
                  placeholder="90"
                  className="flex-1"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </Card>
        </Section>

        {/* Carousel */}
        <Section title="Carousel">
          <Card>
            <Carousel
              items={[
                {
                  id: "a",
                  title: "Slide one",
                  body: "Auto-advances every 4 seconds.",
                },
                {
                  id: "b",
                  title: "Slide two",
                  body: "Swipe horizontally or tap a dot.",
                },
                {
                  id: "c",
                  title: "Slide three",
                  body: "Pauses while you interact.",
                },
              ]}
              renderItem={(s) => (
                <View className="items-center py-4">
                  <H4 className="mb-1.5">{s.title}</H4>
                  <Body className="text-center" style={{ maxWidth: 240 }}>
                    {s.body}
                  </Body>
                </View>
              )}
            />
          </Card>
        </Section>

        {/* Shadows */}
        <Section title="Shadows">
          <View className="flex-row flex-wrap gap-3">
            {[
              { c: "shadow-sm", name: "sm" },
              { c: "shadow-md", name: "md" },
              { c: "shadow-lg", name: "lg" },
              {
                c: "shadow-orange-glow border border-[rgba(241,88,37,0.3)]",
                name: "orange glow",
              },
            ].map((s) => (
              <View key={s.name} className="items-center">
                <View className={`bg-surface-2 h-14 w-20 rounded-xl ${s.c}`} />
                <BodySm className="mt-1.5" style={{ fontSize: 10 }}>
                  {s.name}
                </BodySm>
              </View>
            ))}
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
