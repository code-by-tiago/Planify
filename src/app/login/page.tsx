import { LoginPageClient } from "./LoginPageClient";

export type LoginSearchParams = {
  portal?: string;
  redirect?: string;
  premium?: string;
  cadastro?: string;
  sessao_expirada?: string;
};

type LoginPageProps = {
  searchParams: Promise<LoginSearchParams>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  return <LoginPageClient initialSearchParams={params} />;
}
