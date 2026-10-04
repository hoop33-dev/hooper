"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, type Appearance, type Stripe } from "@stripe/stripe-js";
import type { ReactNode } from "react";

let stripePromise: Promise<Stripe | null> | null = null;
function getStripe() {
  stripePromise ??= loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  return stripePromise;
}

const FONT_CSS =
  "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&display=swap";

/** Matches `Field dark` on the auth/checkout screens. */
const DARK: Appearance = {
  theme: "night",
  variables: {
    colorPrimary: "#F15825",
    colorBackground: "#262223",
    colorText: "#FFFFFF",
    colorTextSecondary: "rgba(255,255,255,0.62)",
    colorTextPlaceholder: "rgba(255,255,255,0.3)",
    colorDanger: "#F87171",
    fontFamily: "Outfit, Arial, sans-serif",
    fontSizeBase: "14.5px",
    borderRadius: "9px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1px solid rgba(255,255,255,0.14)",
      boxShadow: "none",
      padding: "13px 14px",
    },
    ".Input:focus": { border: "1px solid #F15825", boxShadow: "none" },
    ".Label": {
      fontSize: "10.5px",
      fontWeight: "600",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.45)",
    },
  },
};

/** Matches `Field` on the light account pages. */
const LIGHT: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#F15825",
    colorBackground: "#FFFFFF",
    colorText: "#1A1718",
    colorTextSecondary: "#6B6567",
    colorDanger: "#C53030",
    fontFamily: "Outfit, Arial, sans-serif",
    fontSizeBase: "14px",
    borderRadius: "9px",
  },
  rules: {
    ".Input": { border: "1px solid #E8E5E0", boxShadow: "none" },
    ".Input:focus": { border: "1px solid #F15825", boxShadow: "none" },
    ".Label": {
      fontSize: "10.5px",
      fontWeight: "600",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "#A09C9D",
    },
  },
};

export function StripeProvider({
  clientSecret,
  theme,
  children,
}: {
  clientSecret: string;
  theme: "dark" | "light";
  children: ReactNode;
}) {
  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret,
        appearance: theme === "dark" ? DARK : LIGHT,
        fonts: [{ cssSrc: FONT_CSS }],
        loader: "never",
      }}>
      {children}
    </Elements>
  );
}

/** Card only for v1 — Apple Pay / Google Pay come later. */
export const PAYMENT_ELEMENT_OPTIONS = {
  layout: "tabs" as const,
  wallets: { applePay: "never" as const, googlePay: "never" as const },
};
