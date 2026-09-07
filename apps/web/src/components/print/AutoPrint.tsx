"use client";

import { useEffect } from "react";

/** Opens the browser print dialog once fonts and images have settled, and
 * closes the tab afterwards. Disabled with `?noprint=1` for debugging the
 * layout on screen. */
export function AutoPrint({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const onAfterPrint = () => window.close();
    window.addEventListener("afterprint", onAfterPrint);

    (async () => {
      try {
        await document.fonts?.ready;
      } catch {
        // fonts API unavailable — carry on
      }
      await Promise.all(
        [...document.images].map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.addEventListener("load", () => resolve(), { once: true });
                img.addEventListener("error", () => resolve(), { once: true });
              }),
        ),
      );
      // Give <doc-page> a frame or two to measure its header/footer spacers.
      await new Promise((r) => setTimeout(r, 300));
      if (!cancelled) window.print();
    })();

    return () => {
      cancelled = true;
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, [enabled]);

  return null;
}
