import type { Metadata, Viewport } from "next";
import { PlanifySessionSync } from "@/components/auth/PlanifySessionSync";
import { buildGlobalMetadata } from "@/lib/seo/metadata";
import "./planify-hud.css";
import "./globals.css";
import "./responsive-nav.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#00d4ff",
};

export const metadata: Metadata = {
  ...buildGlobalMetadata(),
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
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <PlanifySessionSync />
        {children}
      </body>
    </html>
  );
}
