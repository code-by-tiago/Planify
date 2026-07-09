import Link from "next/link";
import { PLANIFY_EXPORT_CSS } from "@/lib/editor/editor-print-html";
import { getSupabaseAdminClient } from "@/server/supabase/admin-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SharedMaterial = {
  id: string;
  title: string;
  html: string;
  toolId: string | null;
  viewCount: number;
  createdAt: string;
};

async function loadSharedMaterial(
  id: string,
  options?: { incrementView?: boolean },
): Promise<SharedMaterial | null> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await (supabase as any)
      .from("shared_materials")
      .select("id,title,html,tool_id,view_count,created_at,expires_at")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
      return null;
    }

    const nextCount = Number(data.view_count || 0) + (options?.incrementView ? 1 : 0);
    if (options?.incrementView) {
      await (supabase as any)
        .from("shared_materials")
        .update({ view_count: nextCount })
        .eq("id", id);
    }

    return {
      id: data.id,
      title: data.title,
      html: data.html,
      toolId: data.tool_id,
      viewCount: options?.incrementView ? nextCount : Number(data.view_count || 0),
      createdAt: data.created_at,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const material = await loadSharedMaterial(id, { incrementView: false });
  return {
    title: material ? `${material.title} | Planify` : "Material compartilhado | Planify",
    description:
      "Material pedagógico gerado no Planify. Crie o seu grátis em segundos.",
    robots: { index: false, follow: false },
  };
}

export default async function SharedMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const material = await loadSharedMaterial(id, { incrementView: true });

  if (!material) {
    return (
      <main className="min-h-[100dvh] bg-slate-50 px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900">Link indisponível</h1>
        <p className="mt-3 text-sm text-slate-600">
          Este material não existe ou o link expirou.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-2xl bg-cyan-500 px-5 text-sm font-bold text-white"
        >
          Conhecer o Planify
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-slate-100">
      <div className="sticky top-0 z-20 border-b border-cyan-200/60 bg-[#0A192F] px-4 py-3 text-white shadow-lg">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold leading-5 sm:max-w-xl">
            Gostou dessa atividade? Gerada em segundos no Planify. Clique para criar as
            suas grátis.
          </p>
          <Link
            href="/?utm_source=share&utm_medium=viral&utm_campaign=shared_material"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400 px-4 text-sm font-extrabold text-[#0A192F] transition hover:bg-cyan-300"
          >
            Criar grátis no Planify
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
            Material compartilhado
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">
            {material.title}
          </h1>
        </header>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3 text-xs font-medium text-slate-500">
            Visualização · {material.viewCount} visualização(ões)
          </div>
          <div className="p-4 sm:p-8">
            <style dangerouslySetInnerHTML={{ __html: PLANIFY_EXPORT_CSS }} />
            <div
              className="planify-doc prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: material.html }}
            />
          </div>
        </article>

        <footer className="mt-8 pb-10 text-center text-xs font-medium text-slate-500">
          Gerado com{" "}
          <Link href="/" className="font-bold text-cyan-700 hover:underline">
            Planify
          </Link>
        </footer>
      </div>
    </main>
  );
}
