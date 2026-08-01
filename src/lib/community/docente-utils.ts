import type { DocenteDisciplina, DocenteMenuItem } from "@/lib/community/docente-types";

const VALID_MENU_ITEMS: DocenteMenuItem[] = [
  "inicio",
  "discussoes",
  "materiais",
  "eventos",
  "grupos",
  "professores",
  "desafios",
  "salvos",
];

export function parseDocenteMenuItem(value: string | null): DocenteMenuItem | null {
  if (!value) return null;
  return VALID_MENU_ITEMS.includes(value as DocenteMenuItem)
    ? (value as DocenteMenuItem)
    : null;
}

export function formatDocenteNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatDocenteTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} hora${hours > 1 ? "s" : ""}`;
  const days = Math.floor(hours / 24);
  return `há ${days} dia${days > 1 ? "s" : ""}`;
}

export function formatEventMonth(iso: string): { day: number; month: string } {
  const date = new Date(iso);
  const months = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  return { day: date.getDate(), month: months[date.getMonth()] || "JUN" };
}

export function formatEventDateTime(iso: string): { dateLabel: string; timeLabel: string } {
  try {
    const date = new Date(iso);
    const dateLabel = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
    const timeLabel = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
    return { dateLabel, timeLabel };
  } catch {
    return { dateLabel: "", timeLabel: "" };
  }
}

export function formatEventShortTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export const DOCENTE_DISCIPLINAS: DocenteDisciplina[] = [
  "Língua Portuguesa",
  "Matemática",
  "Ciências",
  "História",
  "Geografia",
  "Inglês",
  "Artes",
  "Educação Física",
  "Multidisciplinar",
];

const DISCIPLINA_ALIASES: Record<string, DocenteDisciplina> = {
  redação: "Língua Portuguesa",
  "escrita criativa": "Língua Portuguesa",
  biologia: "Ciências",
  física: "Ciências",
  química: "Ciências",
  arte: "Artes",
  "língua inglesa": "Inglês",
  multicomponente: "Multidisciplinar",
};

export function normalizeDocenteDisciplina(
  value: string | null | undefined,
): DocenteDisciplina {
  const normalized = String(value || "").trim();
  if (!normalized) return "Multidisciplinar";
  if (DOCENTE_DISCIPLINAS.includes(normalized as DocenteDisciplina)) {
    return normalized as DocenteDisciplina;
  }
  const alias = DISCIPLINA_ALIASES[normalized.toLowerCase()];
  if (alias) return alias;
  return "Multidisciplinar";
}

const DISCIPLINA_COLORS: Record<DocenteDisciplina, string> = {
  "Língua Portuguesa": "bg-rose-50 text-rose-700",
  Matemática: "bg-blue-50 text-blue-700",
  Ciências: "bg-emerald-50 text-emerald-700",
  História: "bg-amber-50 text-amber-700",
  Geografia: "bg-teal-50 text-teal-700",
  Inglês: "bg-indigo-50 text-indigo-700",
  Artes: "bg-purple-50 text-purple-700",
  "Educação Física": "bg-orange-50 text-orange-700",
  Multidisciplinar: "bg-slate-100 text-slate-700",
};

export function getDisciplinaColor(disciplina: DocenteDisciplina): string {
  return DISCIPLINA_COLORS[disciplina] ?? "bg-slate-100 text-slate-700";
}

/** Returns disciplina label for display, or null when Multidisciplinar (hidden from UI). */
export function formatDisciplinaMeta(
  disciplina: DocenteDisciplina | string | null | undefined,
): string | null {
  const normalized = normalizeDocenteDisciplina(disciplina);
  if (normalized === "Multidisciplinar") return null;
  return normalized;
}

export function readEmbedded(searchParams: { get(name: string): string | null }): boolean {
  return searchParams.get("embedded") === "1";
}

export function isComunidadeEmbedded(
  searchParams: { get(name: string): string | null },
  forceEmbedded?: boolean,
): boolean {
  return Boolean(forceEmbedded) || readEmbedded(searchParams);
}

export function isComunidadeDashboardEmbed(
  pathname: string,
  searchParams: { get(name: string): string | null },
): boolean {
  return pathname === "/dashboard" && searchParams.get("secao") === "marketplace";
}

export function resolveComunidadeEmbedFromLocation(
  pathname: string,
  searchParams: { get(name: string): string | null },
  forceEmbedded?: boolean,
): boolean {
  return (
    Boolean(forceEmbedded) ||
    isComunidadeDashboardEmbed(pathname, searchParams) ||
    readEmbedded(searchParams)
  );
}

export function buscaHref(query: string, embedded?: boolean): string {
  const base = embedded ? comunidadeRoutes.buscaEmbedded : comunidadeRoutes.busca;
  const trimmed = query.trim();
  if (!trimmed) return base;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}q=${encodeURIComponent(trimmed)}`;
}

export function mapComunidadeHrefToEmbed(href: string): string {
  if (!href.startsWith("/comunidade")) return href;

  const discussao = href.match(/^\/comunidade\/discussao\/([^/?#]+)/);
  if (discussao) return comunidadeRoutes.discussao(discussao[1], true);

  const grupo = href.match(/^\/comunidade\/grupo\/([^/?#]+)/);
  if (grupo) {
    try {
      const url = new URL(href, "https://planify.local");
      const tab = url.searchParams.get("tab");
      return comunidadeRoutes.grupo(grupo[1], true, tab || undefined);
    } catch {
      return comunidadeRoutes.grupo(grupo[1], true);
    }
  }

  const professor = href.match(/^\/comunidade\/professor\/([^/?#]+)/);
  if (professor) return comunidadeRoutes.professor(professor[1], true);

  const evento = href.match(/^\/comunidade\/evento\/([^/?#]+)/);
  if (evento) return comunidadeRoutes.evento(evento[1], true);

  const material = href.match(/^\/comunidade\/material\/([^/?#]+)/);
  if (material) return comunidadeRoutes.material(material[1], true);

  if (href.startsWith("/comunidade/busca")) {
    try {
      const url = new URL(href, "https://planify.local");
      return buscaHref(url.searchParams.get("q") || "", true);
    } catch {
      return comunidadeRoutes.buscaEmbedded;
    }
  }

  if (href === "/comunidade/desafios" || href.startsWith("/comunidade/desafios?")) {
    return comunidadeRoutes.desafiosEmbedded;
  }

  if (href === "/comunidade" || href.startsWith("/comunidade?")) {
    try {
      const url = new URL(href, "https://planify.local");
      const aba = parseDocenteMenuItem(url.searchParams.get("aba"));
      return aba ? homeWithAba(aba, true) : comunidadeRoutes.homeEmbedded;
    } catch {
      return comunidadeRoutes.homeEmbedded;
    }
  }

  return href;
}

export function resolveComunidadeNavigationHref(
  href: string,
  pathname: string,
  searchParams: { get(name: string): string | null },
): string {
  if (!resolveComunidadeEmbedFromLocation(pathname, searchParams)) return href;
  return mapComunidadeHrefToEmbed(href);
}

function withEmbedded(path: string, embedded?: boolean) {
  if (!embedded) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}embedded=1`;
}

export function homeWithAba(aba: DocenteMenuItem, embedded?: boolean): string {
  if (aba === "desafios") return embedded ? comunidadeRoutes.desafiosEmbedded : comunidadeRoutes.desafios;
  if (aba === "professores") return embedded ? comunidadeRoutes.buscaEmbedded : comunidadeRoutes.busca;
  if (embedded) {
    return aba === "inicio"
      ? comunidadeRoutes.homeEmbedded
      : `${comunidadeRoutes.homeEmbedded}&aba=${aba}`;
  }
  return aba === "inicio" ? comunidadeRoutes.home : `${comunidadeRoutes.home}?aba=${aba}`;
}

export type DocenteOverviewFilters = {
  search?: string;
  disciplina?: string | null;
  componente?: string | null;
  etapa?: string | null;
  tipoMaterial?: string | null;
  tag?: string | null;
  mineOnly?: boolean;
  friendsOnly?: boolean;
  savedOnly?: boolean;
  hiddenOnly?: boolean;
};

export function buildOverviewQueryParams(filters: DocenteOverviewFilters): string {
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set("q", filters.search.trim());
  if (filters.disciplina) params.set("disciplina", filters.disciplina);
  if (filters.componente) params.set("componente", filters.componente);
  if (filters.etapa) params.set("etapa", filters.etapa);
  if (filters.tipoMaterial) params.set("tipoMaterial", filters.tipoMaterial);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.mineOnly) params.set("mine", "true");
  if (filters.friendsOnly) params.set("friendsOnly", "true");
  if (filters.savedOnly) params.set("saved", "true");
  if (filters.hiddenOnly) params.set("hiddenOnly", "true");
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function dashboardView(view: string, id?: string) {
  const params = new URLSearchParams({ secao: "marketplace", comunidadeView: view });
  if (id) params.set("comunidadeId", id);
  return `/dashboard?${params.toString()}`;
}

export const comunidadeRoutes = {
  home: "/comunidade",
  homeEmbedded: "/dashboard?secao=marketplace",
  discussao: (id: string, embedded?: boolean) =>
    embedded ? dashboardView("discussao", id) : `/comunidade/discussao/${id}`,
  grupo: (id: string, embedded?: boolean, tab?: string) => {
    if (embedded) {
      const params = new URLSearchParams({
        secao: "marketplace",
        comunidadeView: "grupo",
        comunidadeId: id,
      });
      if (tab) params.set("tab", tab);
      return `/dashboard?${params.toString()}`;
    }
    return tab ? `/comunidade/grupo/${id}?tab=${encodeURIComponent(tab)}` : `/comunidade/grupo/${id}`;
  },
  professor: (id: string, embedded?: boolean) =>
    embedded ? dashboardView("professor", id) : `/comunidade/professor/${id}`,
  evento: (id: string, embedded?: boolean) =>
    embedded ? dashboardView("evento", id) : `/comunidade/evento/${id}`,
  material: (id: string, embedded?: boolean) =>
    embedded ? dashboardView("material", id) : `/comunidade/material/${id}`,
  desafios: "/comunidade/desafios",
  desafiosEmbedded: dashboardView("desafios"),
  busca: "/comunidade/busca",
  buscaEmbedded: dashboardView("busca"),
  messages: "/dashboard?secao=marketplace&painel=mensagens",
};
