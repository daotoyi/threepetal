import type { Metadata } from "next";
import { Inter, Quicksand, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: "Threepetal",
  title: "Threepetal — a cozy puzzle garden you own",
  description:
    "A calm, ad-free puzzle game. Play the first chapter free, unlock the full garden with a one-time purchase. Your progress is saved in the cloud.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${quicksand.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
