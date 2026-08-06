import { Button } from "@/src/components/ui";
import { View } from "react-native";

type SessionFooterNavProps = {
  canGoPrev: boolean;
  isLastBlock: boolean;
  onPrev: () => void;
  onNext: () => void;
  onComplete: () => void;
};

export function SessionFooterNav({
  canGoPrev,
  isLastBlock,
  onPrev,
  onNext,
  onComplete,
}: SessionFooterNavProps) {
  return (
    <View className="border-border-subtle flex-row gap-2.5 border-t px-5 pb-8 pt-2.5">
      {canGoPrev ? (
        <Button variant="secondary" size="lg" className="flex-1" onPress={onPrev}>
          Prev
        </Button>
      ) : (
        <View className="flex-1" />
      )}
      {!isLastBlock ? (
        <Button variant="primary" size="lg" className="flex-[2]" onPress={onNext}>
          Next block
        </Button>
      ) : (
        <Button variant="primary" size="lg" className="bg-success flex-[2]" onPress={onComplete}>
          Complete session
        </Button>
      )}
    </View>
  );
}
