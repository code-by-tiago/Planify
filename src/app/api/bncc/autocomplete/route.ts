import { NextRequest, NextResponse } from "next/server";
import { requireApiAuthenticated } from "@/server/auth/api-access";
import {
  browseBnccTemaSuggestions,
  searchBnccTemaSuggestions,
} from "@/server/bncc/bncc-tema-autocomplete";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuthenticated(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || searchParams.get("query") || "";
  const etapa = searchParams.get("etapa") || undefined;
  const anoSerie =
    searchParams.get("anoSerie") || searchParams.get("serie") || undefined;
  const componente =
    searchParams.get("componente") ||
    searchParams.get("componenteCurricular") ||
    undefined;
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit") || 8), 1),
    12,
  );

  try {
    const trimmedQuery = query.trim();
    const context = { etapa, anoSerie, componente };
    const canBrowse =
      trimmedQuery.length < 2 &&
      Boolean(componente?.trim()) &&
      Boolean((anoSerie || etapa)?.trim());

    const suggestions = canBrowse
      ? await browseBnccTemaSuggestions(context, limit)
      : await searchBnccTemaSuggestions(trimmedQuery, context, limit);

    return NextResponse.json({
      success: true,
      suggestions,
      total: suggestions.length,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível buscar sugestões de tema BNCC.";

    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 },
    );
  }
}
