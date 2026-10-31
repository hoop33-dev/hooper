import { View } from "react-native";

type SwitchProps = {
  on: boolean;
  /** Accent colour of the "on" track (hex). */
  accent: string;
};

/** A presentational toggle pill. Wrap in a Pressable to make it interactive. */
export function Switch({ on, accent }: SwitchProps) {
  return (
    <View
      className="h-[26px] w-[42px] shrink-0 justify-center rounded-full px-[3px]"
      style={{ backgroundColor: on ? accent : "rgba(255,255,255,0.10)" }}>
      <View
        className="h-5 w-5 rounded-full bg-white"
        style={{
          alignSelf: on ? "flex-end" : "flex-start",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 3,
        }}
      />
    </View>
  );
}
