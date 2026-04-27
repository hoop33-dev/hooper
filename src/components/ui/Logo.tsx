import { Image, type ImageProps } from "react-native";

type LogoProps = Omit<ImageProps, "source"> & {
  height?: number;
};

export function Logo({ height = 68, style, ...rest }: LogoProps) {
  return (
    <Image
      source={require("../../../assets/images/logo.png")}
      style={[
        {
          height,
          width: height * 4,
          resizeMode: "contain",
        },
        style,
      ]}
      {...rest}
    />
  );
}
