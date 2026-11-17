import { type ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

type IconTileProps = {
  /** Accent colour (hex). The tile's fill and border are derived from it. */
  color: string;
  /** Square side length. Default 38. */
  size?: number;
  /** Corner radius. Default 10. */
  radius?: number;
  /** Hex alpha suffix for the fill. Default "14" (~8%). */
  bgAlpha?: string;
  /** Hex alpha suffix for the border. Default "30" (~19%). */
  borderAlpha?: string;
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * A rounded, accent-tinted square that holds an icon — the recurring
 * "icon chip" used in menu rows, headers and cards. Fill and border are
 * tinted from a single `color` so callers never hand-mix rgba values.
 */
export function IconTile({
  color,
  size = 38,
  radius = 10,
  bgAlpha = "14",
  borderAlpha = "30",
  children,
  className = "",
  style,
}: IconTileProps) {
  return (
    <View
      className={`items-center justify-center border ${className}`}
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: `${color}${bgAlpha}`,
          borderColor: `${color}${borderAlpha}`,
        },
        style,
      ]}>
      {children}
    </View>
  );
}
