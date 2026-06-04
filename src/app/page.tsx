import { redirect } from "next/navigation";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * A home do site é o painel único (/dashboard).
 * Preserva ?tipo=, ?tema= etc. vindos de links antigos na raiz.
 */
export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const qs = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      qs.set(key, value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        qs.append(key, item);
      }
    }
  }

  const query = qs.toString();
  redirect(query ? `/dashboard?${query}` : "/dashboard");
}
