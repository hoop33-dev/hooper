import { Button, Meta } from "@/src/components/ui";
import { colors, easing } from "@/src/constants/theme";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  BackHandler,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import {
  KeyboardEvents,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export type ValueEditorRequest = {
  unitType: string;
  initialValue: number | undefined;
  /** Whether to offer "Apply to later sets" for this field. */
  showApplyForward: boolean;
  /** Called with the parsed number, or null when left blank / invalid. */
  onCommit: (value: number | null) => void;
  onApplyForward: (value: number) => void;
};

const OpenValueEditorContext = createContext<(req: ValueEditorRequest) => void>(
  () => {},
);

/** Opens the shared set-value editor. Call from a field box's onPress. */
export const useOpenValueEditor = () => useContext(OpenValueEditorContext);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Empty counts as 0 (a blank field is a real, applicable value); `null` is
 * reserved for genuinely malformed input (e.g. "1.2.3"), which leaves the
 * existing value untouched. */
function parseValue(text: string): number | null {
  const cleaned = text.replace(/[^0-9.]/g, "");
  if (cleaned.trim() === "") return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Focuses the input on open, and ties the sheet's lifetime to the keyboard.
 * Once the keyboard has appeared, its going away — the keyboard's own dismiss
 * key ("tick"), which fires no editor action, or a swipe-down — is treated as
 * a confirm. The hardware back button is a cancel. Every show/hide variant is
 * observed since which ones an Android keyboard emits varies; `armed` ignores
 * a stray hide during the open animation and the deferred re-check lets a
 * tapped sheet button resolve the sheet first.
 */
function useSheetKeyboardSync(
  open: boolean,
  inputRef: RefObject<TextInput | null>,
  reqRef: RefObject<ValueEditorRequest | null>,
  confirm: () => void,
  cancel: () => void,
) {
  useEffect(() => {
    if (!open) return;
    let armed = false;
    const back = BackHandler.addEventListener("hardwareBackPress", () => {
      cancel();
      return true;
    });
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 50);
    const armTimer = setTimeout(() => {
      armed = true;
    }, 500);
    let hideTimer: ReturnType<typeof setTimeout>;
    const onShow = () => {
      armed = true;
    };
    const onHide = () => {
      if (!armed) return;
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (reqRef.current) confirm();
      }, 50);
    };
    const subs = [
      KeyboardEvents.addListener("keyboardWillShow", onShow),
      KeyboardEvents.addListener("keyboardDidShow", onShow),
      KeyboardEvents.addListener("keyboardWillHide", onHide),
      KeyboardEvents.addListener("keyboardDidHide", onHide),
    ];
    return () => {
      back.remove();
      clearTimeout(focusTimer);
      clearTimeout(armTimer);
      clearTimeout(hideTimer);
      subs.forEach((s) => s.remove());
    };
  }, [open, inputRef, reqRef, confirm, cancel]);
}

/**
 * Hosts the one "edit a set value" sheet for the whole session player, as an
 * in-tree overlay rather than a React Native `<Modal>`. A Modal is a separate
 * native window that `react-native-keyboard-controller` (and, on Android,
 * autoFocus / the text caret) can't reach — which is what left the keyboard
 * not appearing and the cursor unmovable. Rendered here, under the app's root
 * `<KeyboardProvider>`, `KeyboardStickyView` and focus behave normally. Only
 * one field is edited at a time, so a single host is enough.
 */
export function ValueEditorHost({ children }: { children: ReactNode }) {
  const [req, setReq] = useState<ValueEditorRequest | null>(null);
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);
  const progress = useSharedValue(0);

  const reqRef = useRef(req);
  reqRef.current = req;
  const textRef = useRef(text);
  textRef.current = text;

  const open = useCallback((next: ValueEditorRequest) => {
    setReq(next);
    setText(next.initialValue !== undefined ? String(next.initialValue) : "");
  }, []);

  // Tears the sheet down. `commit` decides whether the typed value is written
  // (Done / keyboard tick) or discarded (back button / tap-outside). The write
  // runs on the next frame so it doesn't stall the close animation — committing
  // a changed value re-renders the whole player. Nulling reqRef synchronously
  // makes any racing dismissal path (keyboard-hide listener vs. a button's
  // onPress) a no-op.
  const dismiss = useCallback((commit: boolean, forward = false) => {
    const current = reqRef.current;
    if (!current) return;
    const value = parseValue(textRef.current);
    reqRef.current = null;
    Keyboard.dismiss();
    setReq(null);
    if (!commit) return;
    requestAnimationFrame(() => {
      current.onCommit(value);
      if (forward && value !== null) current.onApplyForward(value);
    });
  }, []);

  const confirm = useCallback(() => dismiss(true), [dismiss]);
  const cancel = useCallback(() => dismiss(false), [dismiss]);
  const applyForward = useCallback(() => dismiss(true, true), [dismiss]);

  useEffect(() => {
    progress.value = withTiming(req ? 1 : 0, {
      duration: req ? easing.base : easing.fast,
    });
  }, [req, progress]);

  useSheetKeyboardSync(!!req, inputRef, reqRef, confirm, cancel);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <OpenValueEditorContext.Provider value={open}>
      {children}
      {req ? (
        <EditorOverlay
          req={req}
          text={text}
          onChangeText={setText}
          inputRef={inputRef}
          backdropStyle={backdropStyle}
          onConfirm={confirm}
          onCancel={cancel}
          onApplyForward={applyForward}
        />
      ) : null}
    </OpenValueEditorContext.Provider>
  );
}

function EditorOverlay({
  req,
  text,
  onChangeText,
  inputRef,
  backdropStyle,
  onConfirm,
  onCancel,
  onApplyForward,
}: {
  req: ValueEditorRequest;
  text: string;
  onChangeText: (v: string) => void;
  inputRef: RefObject<TextInput | null>;
  backdropStyle: ReturnType<typeof useAnimatedStyle>;
  onConfirm: () => void;
  onCancel: () => void;
  onApplyForward: () => void;
}) {
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Tapping outside discards the edit. */}
      <AnimatedPressable
        style={[styles.backdrop, backdropStyle]}
        onPress={onCancel}
      />
      <View style={styles.dock} pointerEvents="box-none">
        {/* No bottom safe-area inset here — the keyboard sits directly under
         * the card, so the OS nav-bar gap would just be dead space between
         * the buttons and the keys. */}
        <KeyboardStickyView>
          <View style={styles.card}>
            <Meta className="mb-2 uppercase">{req.unitType}</Meta>
            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={onChangeText}
              onSubmitEditing={onConfirm}
              keyboardType="decimal-pad"
              returnKeyType="done"
              placeholder="—"
              placeholderTextColor={colors.textDisabled}
              autoFocus
              selectTextOnFocus
              style={styles.input}
            />
            {req.showApplyForward ? (
              <View className="flex-row" style={{ gap: 8 }}>
                <Button
                  variant="ghost"
                  size="md"
                  className="flex-1 px-2"
                  onPress={onApplyForward}>
                  Apply later
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1 px-2"
                  onPress={onConfirm}>
                  Done
                </Button>
              </View>
            ) : (
              <Button variant="primary" size="lg" onPress={onConfirm}>
                Done
              </Button>
            )}
          </View>
        </KeyboardStickyView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  dock: {
    flex: 1,
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: colors.surface2,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  input: {
    fontFamily: "BarlowCondensed-ExtraBold",
    fontSize: 40,
    color: colors.textPrimary,
    padding: 0,
    marginBottom: 20,
  },
});
