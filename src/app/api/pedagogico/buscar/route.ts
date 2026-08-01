import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { resolvePedagogicalContext } from "@/server/pedagogical-cache/pedagogical-context-resolver";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BuscarPayload = {
  tema?: string;
  componente?: string;
  etapa?: string;
  anoSerie?: string;
  bnccCodigos?: string[];
};

export async function POST(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as BuscarPayload | null;
  const tema = body?.tema?.trim() || "";
  const bnccCodigos = (body?.bnccCodigos || [])
    .map((c) => String(c).trim().toUpperCase())
    .filter(Boolean);

  if (!tema && !bnccCodigos.length) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Informe tema ou códigos BNCC." },
      },
      { status: 400 },
    );
  }

  const result = await resolvePedagogicalContext(
    {
      tema,
      componente: body?.componente?.trim(),
      etapa: body?.etapa?.trim(),
      anoSerie: body?.anoSerie?.trim(),
      bnccCodigos,
    },
    {
      allowScrape: true,
      minApproved: 1,
      userId: auth.access.user?.id ?? null,
      toolTipo: "pedagogical_search",
      trigger: "user_miss",
    },
  );

  if (result.kind === "cache_hit") {
    return NextResponse.json({
      success: true,
      kind: "cache_hit",
      entries: result.entries.map((entry) => ({
        id: entry.id,
        title: entry.title,
        summary: entry.summary,
        bodyMarkdown: entry.body_markdown,
        sourceTitle: entry.source_title,
        sourceUrl: entry.source_url,
        reviewStatus: entry.review_status,
        sourceSlug: entry.source_slug,
      })),
      tokensSaved: result.tokensSaved,
    });
  }

  if (result.kind === "cache_miss") {
    return NextResponse.json({
      success: true,
      kind: "cache_miss",
      jobId: result.jobId,
      entries: result.scraped.map((entry) => ({
        id: entry.id,
        title: entry.title,
        summary: entry.summary,
        reviewStatus: entry.review_status,
        sourceSlug: entry.source_slug,
      })),
      message:
        result.scraped.some((e) => e.review_status === "pending")
          ? "Conteúdo raspado — aguarda revisão admin antes do caminho zero-IA."
          : "Nenhum resultado aprovado encontrado.",
    });
  }

  return NextResponse.json({
    success: true,
    kind: "empty",
    entries: [],
  });
}
