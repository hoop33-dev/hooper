"use client";

import { cn } from "@/src/lib/cn";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * A single global "navigation in progress" signal, driven from two sources:
 *
 *  - `<Link>` clicks, via `useLinkStatus()` bridged through `AppLink`'s
 *    `LinkStatusReporter`.
 *  - imperative `router.push` calls wrapped in `useTransition`, via
 *    `useReportNavPending(isPending)`.
 *
 * Next's App Router waits for the destination RSC payload before swapping the
 * page, so without this the UI gives no feedback between click and render.
 * `<TopProgressBar />` turns that dead window into motion.
 */

interface NavProgressContextValue {
  /** > 0 while at least one navigation is pending. */
  pending: boolean;
  begin: () => void;
  end: () => void;
}

const NavProgressContext = createContext<NavProgressContextValue | null>(null);

export function NavProgressProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  const begin = useCallback(() => setCount((c) => c + 1), []);
  const end = useCallback(() => setCount((c) => (c > 0 ? c - 1 : 0)), []);

  // Backstop: a navigation that completes (or is replaced) should never leave
  // the bar stuck. Once the URL actually changes, nothing is pending anymore.
  useEffect(() => {
    setCount(0);
  }, [pathname]);

  return (
    <NavProgressContext.Provider value={{ pending: count > 0, begin, end }}>
      {children}
    </NavProgressContext.Provider>
  );
}

function useNavProgress(): NavProgressContextValue {
  const ctx = useContext(NavProgressContext);
  if (!ctx) {
    throw new Error("useNavProgress must be used within a NavProgressProvider");
  }
  return ctx;
}

/**
 * Mirror a boolean pending flag (typically from `useTransition` or
 * `useLinkStatus`) into the global nav-progress signal for as long as it's
 * true.
 */
export function useReportNavPending(isPending: boolean): void {
  const { begin, end } = useNavProgress();
  const activeRef = useRef(false);

  useEffect(() => {
    if (isPending && !activeRef.current) {
      activeRef.current = true;
      begin();
    } else if (!isPending && activeRef.current) {
      activeRef.current = false;
      end();
    }
  }, [isPending, begin, end]);

  // Release the token if the component unmounts mid-navigation.
  useEffect(() => {
    return () => {
      if (activeRef.current) {
        activeRef.current = false;
        end();
      }
    };
  }, [end]);
}

/**
 * Thin 2px bar pinned to the top of the portal. Creeps toward 90% while a
 * navigation is pending, then snaps to 100% and fades.
 */
export function TopProgressBar() {
  const { pending } = useNavProgress();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pending) {
      setVisible(true);
      setWidth(8);
      const t1 = setTimeout(() => setWidth(65), 120);
      const t2 = setTimeout(() => setWidth(88), 600);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    if (visible) {
      setWidth(100);
      const t = setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 260);
      return () => clearTimeout(t);
    }
  }, [pending, visible]);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[200] h-0.5 transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0",
      )}>
      <div
        className="bg-portal-orange h-full transition-[width] duration-300 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
