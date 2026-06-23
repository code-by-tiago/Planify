import { isSlideDeckHtml } from "@/lib/slides/slide-deck-utils";

export function resolveSlideDeck(
  getHtml: () => string,
  documentType?: string | null,
  forced?: boolean,
): boolean {
  if (forced) return true;
  const type = String(documentType || "").toLowerCase();
  if (type.includes("slides")) return true;
  try {
    return isSlideDeckHtml(getHtml());
  } catch {
    return false;
  }
}

/** Slides API: apenas materiais em slides ou PDF. */
export function resolveSlidesExportCompatible(
  getHtml: () => string,
  documentType?: string | null,
  forced?: boolean,
): boolean {
  if (forced) return true;
  const type = String(documentType || "").toLowerCase();
  if (type.includes("slides")) return true;
  if (type.includes("pdf")) return true;
  try {
    return isSlideDeckHtml(getHtml());
  } catch {
    return false;
  }
}

export function resolveQuizDocument(
  getHtml: () => string,
  documentType?: string | null,
): boolean {
  const type = String(documentType || "").toLowerCase();
  if (
    type.includes("prova") ||
    type.includes("lista") ||
    type.includes("quiz") ||
    type.includes("jogo")
  ) {
    return true;
  }

  try {
    return /planify-questao/i.test(getHtml());
  } catch {
    return false;
  }
}

/** Google Forms — apenas provas/listas com questões estruturadas (não jogos visuais). */
export function resolveFormsExportCompatible(
  getHtml: () => string,
  documentType?: string | null,
): boolean {
  const type = String(documentType || "").toLowerCase();

  if (
    type.includes("jogo") ||
    type.includes("slides") ||
    type.includes("planejamento") ||
    type.includes("flashcards") ||
    type.includes("mapa-mental") ||
    type.includes("plano-aula") ||
    type.includes("sequencia") ||
    type.includes("projeto")
  ) {
    return false;
  }

  if (type.includes("prova") || type.includes("lista") || type.includes("quiz")) {
    return true;
  }

  try {
    const html = getHtml();
    if (/planify-game-table|planify-jogo-visual|planify-game-section/i.test(html)) {
      return false;
    }
    return /planify-questao/i.test(html);
  } catch {
    return false;
  }
}

export function resolveGoogleOAuthReturnTo(explicit?: string): string {
  if (explicit) return normalizeGoogleOAuthReturnTo(explicit);
  if (typeof window === "undefined") return "/dashboard?secao=editor";

  const { pathname, search } = window.location;
  if (pathname.startsWith("/dashboard")) return pathname + search;
  if (pathname === "/historico") return "/dashboard?secao=historico";
  if (pathname.startsWith("/marketplace")) return pathname + search;
  return normalizeGoogleOAuthReturnTo("/editor");
}

/** Evita redirect legado /editor → /dashboard no retorno OAuth. */
export function normalizeGoogleOAuthReturnTo(path: string): string {
  const trimmed = String(path || "").trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/dashboard?secao=editor";
  }

  if (trimmed === "/editor" || trimmed.startsWith("/editor?")) {
    const query = trimmed.includes("?") ? trimmed.slice(trimmed.indexOf("?") + 1) : "";
    const params = new URLSearchParams(query);
    params.delete("secao");
    params.set("secao", "editor");
    params.delete("tipo");
    const qs = params.toString();
    return `/dashboard?${qs}`;
  }

  return trimmed;
}
