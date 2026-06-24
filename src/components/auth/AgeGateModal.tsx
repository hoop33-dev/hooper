import { ScreenTitle } from "@/src/components/ui/Typography";
import type { RoleId } from "@/src/constants/roles";
import { fonts } from "@/src/constants/theme";
import { styled } from "nativewind";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

const StyledSafeAreaView = styled(SafeAreaView);

type AgeGateModalProps = {
  visible: boolean;
  roleId: RoleId;
  onDismiss: () => void;
};

export function AgeGateModal({
  visible,
  roleId,
  onDismiss,
}: AgeGateModalProps) {
  const isPlayer = roleId === "player";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}>
      <View className="flex-1 justify-end bg-black/[72]">
        <StyledSafeAreaView
          className="bg-surface-2 border-danger/30 rounded-t-[20px] border-t p-6 pb-8"
          edges={["bottom"]}>
          <View className="bg-danger/[12] border-danger/30 mb-5 h-14 w-14 items-center justify-center self-center rounded-full border-[1.5px]">
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="#E53E3E"
                strokeWidth={1.8}
                strokeLinejoin="round"
              />
              <Path
                d="M12 9v4"
                stroke="#E53E3E"
                strokeWidth={2}
                strokeLinecap="round"
              />
              <Circle cx={12} cy={16.5} r={1} fill="#E53E3E" />
            </Svg>
          </View>

          <ScreenTitle className="mb-3 text-center">
            You must be 16 or over
          </ScreenTitle>

          <Text
            className="text-text-secondary mb-7 text-center text-sm"
            style={{ fontFamily: fonts.body, lineHeight: 14 * 1.6 }}>
            {isPlayer
              ? "Players must be at least 16 to create their own account. Ask a parent or guardian to sign up and add you as an athlete."
              : "You must be at least 16 years old to create a Hooper account."}
          </Text>

          <TouchableOpacity
            onPress={onDismiss}
            activeOpacity={0.85}
            className="bg-danger h-[52px] items-center justify-center rounded-full">
            <Text
              className="text-text-primary text-[15px] font-bold"
              style={{ fontFamily: fonts.body }}>
              {isPlayer ? "Got it" : "Update date of birth"}
            </Text>
          </TouchableOpacity>
        </StyledSafeAreaView>
      </View>
    </Modal>
  );
}
