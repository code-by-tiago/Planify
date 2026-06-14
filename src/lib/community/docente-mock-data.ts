import type {
  DocenteAuthor,
  DocenteDiscussion,
  DocenteDisciplina,
  DocenteEvent,
  DocenteMaterial,
  DocenteRecentPublication,
  DocenteStats,
} from "@/lib/community/docente-types";

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

function avatar(name: string, bg: string): string {
  const encoded = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encoded}&background=${bg}&color=fff&size=128&bold=true`;
}

const AUTHORS: Record<string, DocenteAuthor> = {
  camila: {
    id: "u-camila",
    name: "Profª. Camila Santos",
    avatarUrl: avatar("Camila Santos", "06B6D4"),
    specialty: "Ciências • Ensino Fundamental",
    materialsCount: 152,
    followersCount: 3100,
    reputation: 2840,
    badges: ["Colaboradora", "Top Materiais"],
    isFollowing: false,
  },
  ricardo: {
    id: "u-ricardo",
    name: "Prof. Ricardo Almeida",
    avatarUrl: avatar("Ricardo Almeida", "0F172A"),
    specialty: "Matemática • 6º ao 9º ano",
    materialsCount: 89,
    followersCount: 1840,
    reputation: 1920,
    badges: ["Mentor"],
    isFollowing: true,
  },
  fernanda: {
    id: "u-fernanda",
    name: "Profª. Fernanda Lima",
    avatarUrl: avatar("Fernanda Lima", "8B5CF6"),
    specialty: "Língua Portuguesa • Literatura",
    materialsCount: 203,
    followersCount: 4200,
    reputation: 3560,
    badges: ["Referência", "Desafios"],
    isFollowing: false,
  },
  marcos: {
    id: "u-marcos",
    name: "Prof. Marcos Vieira",
    avatarUrl: avatar("Marcos Vieira", "F59E0B"),
    specialty: "História • Ensino Médio",
    materialsCount: 67,
    followersCount: 980,
    reputation: 1240,
    badges: ["Novo Colaborador"],
    isFollowing: false,
  },
  juliana: {
    id: "u-juliana",
    name: "Profª. Juliana",
    avatarUrl: avatar("Juliana", "06B6D4"),
    specialty: "Multicomponente • BNCC",
    materialsCount: 45,
    followersCount: 620,
    reputation: 890,
    badges: [],
    isFollowing: false,
  },
};

export const DOCENTE_CURRENT_USER = AUTHORS.juliana;

export const DOCENTE_STATS: DocenteStats = {
  activeTeachers: 18732,
  sharedMaterials: 24815,
  openDiscussions: 5884,
  studyGroups: 1256,
};

export const DOCENTE_DISCUSSIONS: DocenteDiscussion[] = [
  {
    id: "d-1",
    author: AUTHORS.camila,
    title: "Como trabalhar sustentabilidade no Ensino Fundamental?",
    disciplina: "Ciências",
    tags: ["sustentabilidade", "BNCC", "projeto"],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    commentsCount: 24,
    likesCount: 87,
    likedByMe: false,
    savedByMe: false,
  },
  {
    id: "d-2",
    author: AUTHORS.ricardo,
    title: "Sugestões de atividades sobre frações para 6º ano",
    disciplina: "Matemática",
    tags: ["frações", "atividades", "6º ano"],
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    commentsCount: 18,
    likesCount: 64,
    likedByMe: true,
    savedByMe: false,
  },
  {
    id: "d-3",
    author: AUTHORS.fernanda,
    title: "Sequência didática de Literatura de Cordel",
    disciplina: "Língua Portuguesa",
    tags: ["cordel", "literatura", "sequência didática"],
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    commentsCount: 31,
    likesCount: 112,
    likedByMe: false,
    savedByMe: true,
  },
  {
    id: "d-4",
    author: AUTHORS.marcos,
    title: "Dicas para avaliações formativas em sala de aula",
    disciplina: "História",
    tags: ["avaliação formativa", "metodologia"],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    commentsCount: 42,
    likesCount: 156,
    likedByMe: false,
    savedByMe: false,
  },
];

export const DOCENTE_MATERIALS: DocenteMaterial[] = [
  {
    id: "m-1",
    title: "Atividade Sustentabilidade",
    disciplina: "Ciências",
    anoSerie: "6º ao 9º ano",
    author: AUTHORS.camila,
    coverUrl:
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=280&fit=crop",
    viewsCount: 4820,
    likesCount: 312,
    likedByMe: false,
    savedByMe: false,
    fileType: "pdf",
  },
  {
    id: "m-2",
    title: "Frações na prática",
    disciplina: "Matemática",
    anoSerie: "6º ano",
    author: AUTHORS.ricardo,
    coverUrl:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=280&fit=crop",
    viewsCount: 3910,
    likesCount: 245,
    likedByMe: true,
    savedByMe: false,
    fileType: "pptx",
  },
  {
    id: "m-3",
    title: "Literatura de Cordel",
    disciplina: "Língua Portuguesa",
    anoSerie: "8º e 9º ano",
    author: AUTHORS.fernanda,
    coverUrl:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=280&fit=crop",
    viewsCount: 5670,
    likesCount: 428,
    likedByMe: false,
    savedByMe: true,
    fileType: "docx",
  },
  {
    id: "m-4",
    title: "Revolução Francesa",
    disciplina: "História",
    anoSerie: "Ensino Médio",
    author: AUTHORS.marcos,
    coverUrl:
      "https://images.unsplash.com/photo-1461360228754-6e81c478b882?w=400&h=280&fit=crop",
    viewsCount: 2890,
    likesCount: 178,
    likedByMe: false,
    savedByMe: false,
    fileType: "pdf",
  },
];

export const DOCENTE_RECENT_PUBLICATIONS: DocenteRecentPublication[] = [
  {
    id: "rp-1",
    title: "Atividade: Interpretação de texto com charges",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=80&h=80&fit=crop",
    authorName: "Profª. Ana Costa",
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: "rp-2",
    title: "Plano de aula: Frações equivalentes",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=80&h=80&fit=crop",
    authorName: "Prof. Ricardo Almeida",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "rp-3",
    title: "Slides: Sistema Solar interativo",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=80&h=80&fit=crop",
    authorName: "Profª. Camila Santos",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "rp-4",
    title: "Avaliação diagnóstica de Geografia",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=80&h=80&fit=crop",
    authorName: "Prof. Eduardo Moraes",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
];

export const DOCENTE_EVENTS: DocenteEvent[] = [
  {
    id: "e-1",
    title: "BNCC na prática: competências gerais",
    presenterName: "Profª. Helena Ribeiro",
    startsAt: "2026-05-24T19:00:00-03:00",
    isOnline: true,
    day: 24,
    month: "MAI",
  },
  {
    id: "e-2",
    title: "Avaliação formativa com feedback eficaz",
    presenterName: "Prof. Carlos Mendes",
    startsAt: "2026-05-28T19:00:00-03:00",
    isOnline: true,
    day: 28,
    month: "MAI",
  },
  {
    id: "e-3",
    title: "IA para professores: ferramentas do dia a dia",
    presenterName: "Equipe Planify",
    startsAt: "2026-06-05T19:00:00-03:00",
    isOnline: true,
    day: 5,
    month: "JUN",
  },
];

export const DOCENTE_FEATURED_TEACHER = AUTHORS.camila;

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
