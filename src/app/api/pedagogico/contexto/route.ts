import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { resolvePedagogicalContext } from "@/server/pedagogical-cache/pedagogical-context-resolver";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseBnccCodes(value: string | null): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/[,;]/)
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const params = request.nextUrl.searchParams;
  const tema = params.get("tema")?.trim() || "";
  const componente = params.get("componente")?.trim() || undefined;
  const etapa = params.get("etapa")?.trim() || undefined;
  const anoSerie = params.get("anoSerie")?.trim() || undefined;
  const bnccCodigos = parseBnccCodes(params.get("bncc"));

  if (!tema && !bnccCodigos.length) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Informe tema ou código BNCC." },
      },
      { status: 400 },
    );
  }

  const result = await resolvePedagogicalContext(
    { tema, componente, etapa, anoSerie, bnccCodigos },
    {
      allowScrape: false,
      minApproved: 1,
      userId: auth.access.user?.id ?? null,
      toolTipo: "pedagogical_context",
      trigger: "snippet",
    },
  );

  if (result.kind !== "cache_hit") {
    return NextResponse.json({
      success: true,
      kind: result.kind,
      entries: [],
      tokensSaved: 0,
    });
  }

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
      sourceLicense: entry.source_license,
      bnccCodigos: entry.bncc_codigos,
      reviewStatus: entry.review_status,
      sourceSlug: entry.source_slug,
    })),
    tokensSaved: result.tokensSaved,
  });
}
