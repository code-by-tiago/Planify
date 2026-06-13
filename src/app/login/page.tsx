import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
  title: "Entrar",
  description:
    "Entre no Planify com o e-mail e senha criados após a assinatura do plano Professor.",
  path: "/login",
});

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  if (params.mode === "signup") {
    redirect("/planos");
  }

  return <LoginPageClient initialSearchParams={params} />;
}
