import { isSlideDeckHtml } from "@/lib/slides/slide-deck-utils";
import { materialExportAllows } from "@/lib/export/material-export-policy";

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

/** Google Forms — provas/listas com questões estruturadas (não jogos visuais). */
export function resolveFormsExportCompatible(
  getHtml: () => string,
  documentType?: string | null,
): boolean {
  try {
    const html = getHtml();
    const type = String(documentType || "").toLowerCase();

    if (!materialExportAllows("google-forms", documentType, html)) {
      return false;
    }
    if (/planify-game-table|planify-jogo-visual|planify-game-section/i.test(html)) {
      return false;
    }
    if (type.includes("prova") || type.includes("lista")) {
      return true;
    }
    return /planify-questao/i.test(html);
  } catch {
    const type = String(documentType || "").toLowerCase();
    if (type.includes("prova") || type.includes("lista")) {
      return materialExportAllows("google-forms", documentType);
    }
    return materialExportAllows("google-forms", documentType);
  }
}

export function resolveGoogleOAuthReturnTo(explicit?: string): string {
  if (explicit) return normalizeGoogleOAuthReturnTo(explicit);
  if (typeof window === "undefined") return "/dashboard?secao=editor";

  const { pathname, search } = window.location;
  if (pathname.startsWith("/dashboard")) return normalizeGoogleOAuthReturnTo(pathname + search);
  if (pathname === "/historico") return "/dashboard?secao=historico";
  if (pathname.startsWith("/marketplace")) return normalizeGoogleOAuthReturnTo(pathname + search);
  return normalizeGoogleOAuthReturnTo("/editor");
}

function stripGoogleOAuthParams(path: string): string {
  try {
    const url = new URL(path, "http://example.com");
    url.searchParams.delete("google");
    url.searchParams.delete("google_error");
    const qs = url.searchParams.toString();
    return `${url.pathname}${qs ? `?${qs}` : ""}`;
  } catch {
    return path;
  }
}

/** Evita redirect legado /editor → /dashboard no retorno OAuth. */
export function normalizeGoogleOAuthReturnTo(path: string): string {
  const trimmed = String(path || "").trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/dashboard?secao=editor";
  }

  const stripped = stripGoogleOAuthParams(trimmed);

  if (stripped === "/editor" || stripped.startsWith("/editor?")) {
    const query = stripped.includes("?") ? stripped.slice(stripped.indexOf("?") + 1) : "";
    const params = new URLSearchParams(query);
    params.delete("secao");
    params.set("secao", "editor");
    params.delete("tipo");
    const qs = params.toString();
    return `/dashboard?${qs}`;
  }

  return stripped;
}
