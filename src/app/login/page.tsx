import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { LoginPageClient } from "./LoginPageClient";

export type LoginSearchParams = {
  portal?: string;
  redirect?: string;
  premium?: string;
  cadastro?: string;
  sessao_expirada?: string;
  mode?: string;
  email?: string;
};

type LoginPageProps = {
  searchParams: Promise<LoginSearchParams>;
};

export const metadata: Metadata = buildPageMetadata({
  title: "Entrar ou criar conta",
  description:
    "Acesse o Planify IA Educacional: login ou cadastro para professores e gestores escolares usarem geradores com IA, editor e exportação Google Docs.",
  path: "/login",
});

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  return <LoginPageClient initialSearchParams={params} />;
}
