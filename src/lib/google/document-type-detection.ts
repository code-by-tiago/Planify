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

export function resolveGoogleOAuthReturnTo(explicit?: string): string {
  if (explicit) return explicit;
  if (typeof window === "undefined") return "/dashboard?secao=editor";

  const { pathname, search } = window.location;
  if (pathname.startsWith("/dashboard")) return pathname + search;
  if (pathname === "/historico") return "/dashboard?secao=historico";
  if (pathname.startsWith("/marketplace")) return pathname + search;
  return "/editor";
}
