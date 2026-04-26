import { View, type ViewProps } from "react-native";

export type CardVariant = "default" | "accent" | "navy";

type CardProps = ViewProps & {
  variant?: CardVariant;
  className?: string;
};

const variantClasses: Record<CardVariant, string> = {
  default: "bg-surface-2 border border-border-subtle",
  accent: "bg-surface-2 border border-border-subtle",
  navy: "bg-brand-navy",
};

export function Card({
  variant = "default",
  className = "",
  children,
  ...rest
}: CardProps) {
  return (
    <View
      className={`overflow-hidden rounded-xl ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {variant === "accent" && (
        <View className="bg-brand-orange h-[3px] w-full" />
      )}
      <View className="p-4">{children}</View>
    </View>
  );
}
