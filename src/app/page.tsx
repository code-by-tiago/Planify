import { redirect } from "next/navigation";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PlanifyHomePage } from "@/components/public/landing/PlanifyHomePage";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * A raiz "/" é a landing pública do Planify (sem login).
 * O painel (/dashboard) é que exige login/plano via proxy.ts.
 *
 * Deep links antigos (/?tipo=slides&tema=...) continuam a abrir o painel,
 * para não quebrar links já partilhados.
 */
const DEEP_LINK_KEYS = ["tipo", "categoria", "secao", "tema"];

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;

  const hasDeepLink = DEEP_LINK_KEYS.some((key) => Boolean(params[key]));

  if (hasDeepLink) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") {
        qs.set(key, value);
      } else if (Array.isArray(value)) {
        for (const item of value) qs.append(key, item);
      }
    }
    const query = qs.toString();
    redirect(query ? `/dashboard?${query}` : "/dashboard");
  }

  return (
    <main className="planify-institutional planify-ui3 planify-public planify-teachy-landing flex min-h-screen flex-col overflow-x-clip bg-white">
      <PublicHeader active="home" />
      <PlanifyHomePage />
      <PublicFooter />
    </main>
  );
}
