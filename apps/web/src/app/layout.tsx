import type { Metadata } from "next";
import { Barlow_Condensed, Lexend } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-barlow",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hooper Portal",
  description: "Coach program-building portal for the Hooper platform.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${lexend.variable} ${barlowCondensed.variable}`}
    >
      <body className="bg-surface min-h-screen font-sans text-white antialiased">
        {children}
      </body>
    </html>
  );
}
