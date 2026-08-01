import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StructuredData } from "@/components/seo/StructuredData";
import { LandingProfessorPrimeiroPage } from "@/components/public/landing-professor-primeiro/LandingProfessorPrimeiroPage";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { SEO } from "@/lib/seo/constants";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = buildPageMetadata({
  title: SEO.descriptionShort,
  description: SEO.descriptionFull,
  path: "/",
});

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
    <>
      <StructuredData />
      <main className="planify-hud planify-ui3 planify-hud-landing planify-public flex min-h-screen flex-col overflow-x-hidden bg-white sm:overflow-x-clip sm:bg-gradient-to-b sm:from-white sm:via-sky-50/60 sm:to-[var(--planify-canvas)]">
        <LandingProfessorPrimeiroPage />
      </main>
    </>
  );
}
