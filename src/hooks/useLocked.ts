import { useState } from "react";
import { useRouter } from "expo-router";
import { redeemLinkCode } from "@/src/services/auth.service";

export function useLocked() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  async function handleSubmit() {
    if (code.length !== 6) return;
    setLoading(true);
    setAuthError(null);
    try {
      await redeemLinkCode(code.toUpperCase());
      router.replace("/(app)");
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Invalid or expired code.",
      );
    } finally {
      setLoading(false);
    }
  }

  return { code, setCode, loading, authError, handleSubmit };
}
