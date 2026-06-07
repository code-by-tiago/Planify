import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { getSiteUrl } from "@/lib/seo/site-url";
import "./planify-hud.css";
import "./globals.css";

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#00d4ff",
};

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  icons: {
    icon: "/brand/planify-owl-graduate.png",
    apple: "/brand/planify-owl-graduate.png",
  },
  title: {
    default: "Planify | Plataforma Educacional",
    template: "%s | Planify",
  },
  description:
    "Plataforma educacional premium para planejamentos BNCC, materiais com IA, editor, biblioteca e marketplace pedagógico.",
  keywords: [
    "Planify",
    "BNCC",
    "professor",
    "materiais didáticos",
    "planejamento escolar",
    "IA educação",
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "Planify",
    title: "Planify | Assistente de IA para professores",
    description:
      "Crie slides, provas, planejamentos e materiais alinhados à BNCC com exportação DOCX e Google Classroom.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Planify | Assistente de IA para professores",
    description:
      "Materiais pedagógicos com IA alinhados à BNCC — planejamentos, editor e exportação DOCX.",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "MvgDB8L5EBhazEZWiIHAGPz5qUWn6Hk06ssd0zoPJIA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${display.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
