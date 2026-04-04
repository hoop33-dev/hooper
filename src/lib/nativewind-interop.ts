import { styled } from "nativewind";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

// NativeWind v5: styled() replaces cssInterop/remapProps
styled(SafeAreaView, {
  className: "style",
});

styled(LinearGradient, {
  className: "style",
});
