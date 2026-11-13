"use client";

import { AppleIcon, GooglePlayIcon } from "@/src/components/icons";
import { cn } from "@/src/lib/cn";
import { QRCodeSVG } from "qrcode.react";

/** Placeholder until real store listings exist — everything points at the
 * one NEXT_PUBLIC_APP_LINK. */
export const APP_LINK =
  process.env.NEXT_PUBLIC_APP_LINK ?? "https://hooper.co.nz/app";

/** Real QR code for the app link, framed like the design's pseudo-QR. */
export function AppQr({ size = 124 }: { size?: number }) {
  return (
    <div className="shrink-0 rounded-lg bg-white p-2">
      <QRCodeSVG
        value={APP_LINK}
        size={size - 16}
        fgColor="#231F20"
        bgColor="#FFFFFF"
        title="QR code to open the Hooper app"
      />
    </div>
  );
}

export function StoreBadges({ dark = true }: { dark?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {(
        [
          ["Download on the", "App Store", AppleIcon],
          ["Get it on", "Google Play", GooglePlayIcon],
        ] as const
      ).map(([pre, store, Icon]) => (
        <a
          key={store}
          href={APP_LINK}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "flex items-center gap-[9px] rounded-[9px] border px-3.5 py-2",
            dark ? "border-white/20" : "border-bp-border",
          )}>
          <Icon
            size={18}
            className={cn("shrink-0", dark ? "text-white" : "text-bp-text1")}
          />
          <div>
            <div
              className={cn(
                "text-[9px] tracking-[0.06em] uppercase",
                dark ? "text-white/50" : "text-bp-text3",
              )}>
              {pre}
            </div>
            <div
              className={cn(
                "text-[13px] leading-[1.1] font-bold",
                dark ? "text-white" : "text-bp-text1",
              )}>
              {store}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
