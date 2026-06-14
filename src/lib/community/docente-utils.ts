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
];

const DISCIPLINA_COLORS: Record<DocenteDisciplina, string> = {
  "Língua Portuguesa": "bg-rose-50 text-rose-700",
  Matemática: "bg-blue-50 text-blue-700",
  Ciências: "bg-emerald-50 text-emerald-700",
  História: "bg-amber-50 text-amber-700",
  Geografia: "bg-teal-50 text-teal-700",
  Inglês: "bg-indigo-50 text-indigo-700",
  Artes: "bg-purple-50 text-purple-700",
  "Educação Física": "bg-orange-50 text-orange-700",
};

export function getDisciplinaColor(disciplina: DocenteDisciplina): string {
  return DISCIPLINA_COLORS[disciplina] ?? "bg-slate-100 text-slate-700";
}

export function readEmbedded(searchParams: { get(name: string): string | null }): boolean {
  return searchParams.get("embedded") === "1";
}

function withEmbedded(path: string, embedded?: boolean) {
  if (!embedded) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}embedded=1`;
}

export function homeWithAba(aba: DocenteMenuItem, embedded?: boolean): string {
  if (aba === "desafios") return comunidadeRoutes.desafios;
  if (aba === "professores") return comunidadeRoutes.busca;
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
  mineOnly?: boolean;
  friendsOnly?: boolean;
  savedOnly?: boolean;
};

export function buildOverviewQueryParams(filters: DocenteOverviewFilters): string {
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set("q", filters.search.trim());
  if (filters.disciplina) params.set("disciplina", filters.disciplina);
  if (filters.componente) params.set("componente", filters.componente);
  if (filters.mineOnly) params.set("mine", "true");
  if (filters.friendsOnly) params.set("friendsOnly", "true");
  if (filters.savedOnly) params.set("saved", "true");
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const comunidadeRoutes = {
  home: "/comunidade",
  homeEmbedded: "/dashboard?secao=marketplace",
  discussao: (id: string, embedded?: boolean) =>
    withEmbedded(`/comunidade/discussao/${id}`, embedded),
  grupo: (id: string, embedded?: boolean) => withEmbedded(`/comunidade/grupo/${id}`, embedded),
  professor: (id: string, embedded?: boolean) =>
    withEmbedded(`/comunidade/professor/${id}`, embedded),
  evento: (id: string, embedded?: boolean) => withEmbedded(`/comunidade/evento/${id}`, embedded),
  material: (id: string, embedded?: boolean) =>
    withEmbedded(`/comunidade/material/${id}`, embedded),
  desafios: "/comunidade/desafios",
  busca: "/comunidade/busca",
  messages: "/dashboard?secao=marketplace&painel=mensagens",
};
