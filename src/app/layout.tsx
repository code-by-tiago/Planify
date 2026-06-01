import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Planify | SaaS Educacional",
  description: "SaaS premium para planejamentos, materiais didáticos, editor, biblioteca e marketplace educacional.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
