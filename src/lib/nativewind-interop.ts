import { cssInterop } from "nativewind";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

cssInterop(SafeAreaView, {
  className: "style",
});

cssInterop(LinearGradient, {
  className: "style",
});
