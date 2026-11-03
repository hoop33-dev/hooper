import { NavProgressProvider, TopProgressBar } from "@hooper/shared/next";
import type { Metadata } from "next";
import { Barlow_Condensed, Outfit } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-barlow",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hooper Billing",
  description: "Buy Hooper packages and manage your billing.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${barlowCondensed.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        {/* One provider for portal and auth screens alike: every AppLink and
            router.push transition feeds the same top bar. */}
        <NavProgressProvider>
          <TopProgressBar className="bg-orange" />
          {children}
        </NavProgressProvider>
      </body>
    </html>
  );
}
