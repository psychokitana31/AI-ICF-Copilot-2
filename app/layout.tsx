import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ICF AI Copilot — Explainable Decision Intelligence",
  description:
    "ICF (Integrative Cognitive Framework) — an explainable Decision Intelligence platform for human development. Assess Mind, Goal and Capacity signals. Get transparent, structured recommendations.",
  keywords: [
    "decision intelligence",
    "ICF",
    "Integrative Cognitive Framework",
    "AI copilot",
    "human development",
    "explainable AI",
    "decision support",
  ],
  authors: [{ name: "ICF AI Copilot" }],
  openGraph: {
    title: "ICF AI Copilot — Explainable Decision Intelligence",
    description:
      "Transparent, structured decision support across Mind, Goal and Capacity domains.",
    type: "website",
    locale: "en_GB",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
