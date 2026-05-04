import { useState, useEffect, useCallback } from "react";
import { listChildren, type ChildSummary } from "@/src/services/parent.service";

export function useChildren(): {
  children: ChildSummary[];
  isLoading: boolean;
  refresh: () => Promise<void>;
} {
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const data = await listChildren();
    setChildren(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { children, isLoading, refresh };
}
