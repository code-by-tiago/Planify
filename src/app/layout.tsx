import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, Anton } from "next/font/google";
import { PlanifySessionSync } from "@/components/auth/PlanifySessionSync";
import { buildGlobalMetadata } from "@/lib/seo/metadata";
import "./planify-hud.css";
import "../styles/planify-premium.css";
import "./globals.css";
import "./responsive-nav.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const heroDisplay = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-hero-display",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#00d4ff",
};

export const metadata: Metadata = {
  ...buildGlobalMetadata(),
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/brand/planify-owl-graduate.png",
    apple: "/brand/planify-owl-graduate.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${display.variable} ${heroDisplay.variable}`}>
      <body className="font-sans antialiased">
        <PlanifySessionSync />
        {children}
      </body>
    </html>
  );
}
