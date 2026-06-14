import type { DocenteDisciplina } from "@/lib/community/docente-types";

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

export const comunidadeRoutes = {
  home: "/comunidade",
  discussao: (id: string) => `/comunidade/discussao/${id}`,
  grupo: (id: string) => `/comunidade/grupo/${id}`,
  professor: (id: string) => `/comunidade/professor/${id}`,
  evento: (id: string) => `/comunidade/evento/${id}`,
  material: (id: string) => `/comunidade/material/${id}`,
  desafios: "/comunidade/desafios",
  busca: "/comunidade/busca",
};
