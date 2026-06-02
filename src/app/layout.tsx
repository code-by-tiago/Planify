import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Planify | Plataforma Educacional",
  description: "Plataforma educacional premium para planejamentos, materiais didáticos, editor, biblioteca e marketplace pedagógico.",
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
