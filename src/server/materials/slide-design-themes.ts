/**
 * Temas de DESIGN das apresentações Planify.
 *
 * Cada tema é um sistema visual completo (paleta, tipografia, fundo, cabeçalho
 * e decoração) aplicado tanto na pré-visualização HTML quanto na exportação
 * para Google Apresentações (PPTX). Módulo de dados puros: pode ser importado
 * no servidor e no cliente.
 */

export const SLIDE_THEME_IDS = [
  "moderno",
  "editorial",
  "minimal",
  "vibrante",
  "academico",
  "lousa",
] as const;

export type SlideThemeId = (typeof SLIDE_THEME_IDS)[number];

export type SlideHeaderKind = "bar" | "ribbon" | "underline" | "block" | "chalk";
export type SlideDecoration = "blob" | "corner" | "line" | "dots" | "chalk" | "none";

export type SlideTheme = {
  id: SlideThemeId;
  label: string;
  descricao: string;
  /** Cores para a mini-prévia no seletor da UI. */
  preview: string[];
  fontHeading: string;
  fontBody: string;

  /** Capa */
  coverBgCss: string;
  coverBgHex: string;
  coverBgHex2: string;
  coverInk: string;
  coverMutedInk: string;
  coverBadgeBg: string;
  coverBadgeInk: string;

  /** Conteúdo */
  contentBgHex: string;
  pageBgCss: string;
  cardBgCss: string;
  cardBgHex: string;
  cardBorderCss: string;
  titleInk: string;
  bodyInk: string;
  mutedInk: string;
  accentHex: string;
  accentSoftCss: string;
  accentSoftHex: string;

  headerKind: SlideHeaderKind;
  decoration: SlideDecoration;
  /** Tema de fundo escuro (texto claro). */
  dark: boolean;
};

export const SLIDE_THEMES: Record<SlideThemeId, SlideTheme> = {
  moderno: {
    id: "moderno",
    label: "Moderno",
    descricao: "Gradiente vibrante, formas suaves e tipografia sem serifa",
    preview: ["#4f46e5", "#7c3aed", "#a78bfa"],
    fontHeading: "Calibri",
    fontBody: "Calibri",
    coverBgCss: "linear-gradient(135deg,#4f46e5 0%,#7c3aed 60%,#a855f7 100%)",
    coverBgHex: "4F46E5",
    coverBgHex2: "9333EA",
    coverInk: "FFFFFF",
    coverMutedInk: "E9D5FF",
    coverBadgeBg: "rgba(255,255,255,0.18)",
    coverBadgeInk: "FFFFFF",
    contentBgHex: "FFFFFF",
    pageBgCss: "#ffffff",
    cardBgCss: "#ffffff",
    cardBgHex: "FFFFFF",
    cardBorderCss: "1px solid #e8e6f5",
    titleInk: "0F172A",
    bodyInk: "334155",
    mutedInk: "64748B",
    accentHex: "6D28D9",
    accentSoftCss: "#f5f3ff",
    accentSoftHex: "F5F3FF",
    headerKind: "bar",
    decoration: "blob",
    dark: false,
  },
  editorial: {
    id: "editorial",
    label: "Editorial",
    descricao: "Elegante, com serifa, tons creme e linhas finas",
    preview: ["#7c2d12", "#b45309", "#fde68a"],
    fontHeading: "Georgia",
    fontBody: "Georgia",
    coverBgCss: "linear-gradient(135deg,#fbf3e4 0%,#f6e7cf 100%)",
    coverBgHex: "FBF3E4",
    coverBgHex2: "F1E2C6",
    coverInk: "7C2D12",
    coverMutedInk: "92400E",
    coverBadgeBg: "rgba(124,45,18,0.10)",
    coverBadgeInk: "7C2D12",
    contentBgHex: "FBF7EF",
    pageBgCss: "#fbf7ef",
    cardBgCss: "#fffdf8",
    cardBgHex: "FFFDF8",
    cardBorderCss: "1px solid #e7d9bf",
    titleInk: "44260F",
    bodyInk: "4A3A28",
    mutedInk: "9A7B52",
    accentHex: "B45309",
    accentSoftCss: "#fdf4e3",
    accentSoftHex: "FDF4E3",
    headerKind: "underline",
    decoration: "line",
    dark: false,
  },
  minimal: {
    id: "minimal",
    label: "Minimalista",
    descricao: "Muito espaço, contraste sóbrio e detalhe fino",
    preview: ["#0f172a", "#475569", "#e2e8f0"],
    fontHeading: "Arial",
    fontBody: "Arial",
    coverBgCss: "linear-gradient(135deg,#ffffff 0%,#f1f5f9 100%)",
    coverBgHex: "FFFFFF",
    coverBgHex2: "F1F5F9",
    coverInk: "0F172A",
    coverMutedInk: "475569",
    coverBadgeBg: "rgba(15,23,42,0.06)",
    coverBadgeInk: "0F172A",
    contentBgHex: "FFFFFF",
    pageBgCss: "#ffffff",
    cardBgCss: "#ffffff",
    cardBgHex: "FFFFFF",
    cardBorderCss: "1px solid #e2e8f0",
    titleInk: "0F172A",
    bodyInk: "334155",
    mutedInk: "94A3B8",
    accentHex: "0F172A",
    accentSoftCss: "#f1f5f9",
    accentSoftHex: "F1F5F9",
    headerKind: "underline",
    decoration: "line",
    dark: false,
  },
  vibrante: {
    id: "vibrante",
    label: "Vibrante",
    descricao: "Alto contraste, blocos coloridos e energia",
    preview: ["#e11d48", "#f59e0b", "#fb7185"],
    fontHeading: "Trebuchet MS",
    fontBody: "Trebuchet MS",
    coverBgCss: "linear-gradient(135deg,#e11d48 0%,#f43f5e 45%,#f59e0b 100%)",
    coverBgHex: "E11D48",
    coverBgHex2: "F59E0B",
    coverInk: "FFFFFF",
    coverMutedInk: "FFE4E6",
    coverBadgeBg: "rgba(255,255,255,0.2)",
    coverBadgeInk: "FFFFFF",
    contentBgHex: "FFF7F2",
    pageBgCss: "#fff7f2",
    cardBgCss: "#ffffff",
    cardBgHex: "FFFFFF",
    cardBorderCss: "1px solid #fed7c3",
    titleInk: "9F1239",
    bodyInk: "44262B",
    mutedInk: "B45369",
    accentHex: "E11D48",
    accentSoftCss: "#ffe4e6",
    accentSoftHex: "FFE4E6",
    headerKind: "block",
    decoration: "corner",
    dark: false,
  },
  academico: {
    id: "academico",
    label: "Acadêmico",
    descricao: "Sóbrio, azul-marinho e faixas institucionais",
    preview: ["#0f2a4a", "#1d4ed8", "#bfdbfe"],
    fontHeading: "Georgia",
    fontBody: "Arial",
    coverBgCss: "linear-gradient(135deg,#0f2a4a 0%,#1e3a8a 100%)",
    coverBgHex: "0F2A4A",
    coverBgHex2: "1E3A8A",
    coverInk: "FFFFFF",
    coverMutedInk: "BFDBFE",
    coverBadgeBg: "rgba(255,255,255,0.16)",
    coverBadgeInk: "FFFFFF",
    contentBgHex: "FFFFFF",
    pageBgCss: "#f8fafc",
    cardBgCss: "#ffffff",
    cardBgHex: "FFFFFF",
    cardBorderCss: "1px solid #dbe4f0",
    titleInk: "0F2A4A",
    bodyInk: "334155",
    mutedInk: "64748B",
    accentHex: "1D4ED8",
    accentSoftCss: "#eff6ff",
    accentSoftHex: "EFF6FF",
    headerKind: "ribbon",
    decoration: "line",
    dark: false,
  },
  lousa: {
    id: "lousa",
    label: "Lousa",
    descricao: "Quadro escolar escuro com destaque em giz",
    preview: ["#14302a", "#1f3b34", "#fcd34d"],
    fontHeading: "Trebuchet MS",
    fontBody: "Trebuchet MS",
    coverBgCss: "linear-gradient(135deg,#13302a 0%,#1c4038 100%)",
    coverBgHex: "13302A",
    coverBgHex2: "1C4038",
    coverInk: "F8FAFC",
    coverMutedInk: "FCD34D",
    coverBadgeBg: "rgba(252,211,77,0.18)",
    coverBadgeInk: "FCD34D",
    contentBgHex: "163A32",
    pageBgCss: "#163a32",
    cardBgCss: "#1c4038",
    cardBgHex: "1C4038",
    cardBorderCss: "1px solid #2c5249",
    titleInk: "F8FAFC",
    bodyInk: "E2E8F0",
    mutedInk: "9DBBB0",
    accentHex: "FCD34D",
    accentSoftCss: "rgba(252,211,77,0.14)",
    accentSoftHex: "234A41",
    headerKind: "chalk",
    decoration: "chalk",
    dark: true,
  },
};

export function resolveSlideTheme(value: unknown): SlideTheme {
  const id = String(value || "").toLowerCase();
  if ((SLIDE_THEME_IDS as readonly string[]).includes(id)) {
    return SLIDE_THEMES[id as SlideThemeId];
  }
  return SLIDE_THEMES.moderno;
}

/** Metadados leves para o seletor da UI (sem expor todos os tokens). */
export const SLIDE_THEME_OPTIONS = SLIDE_THEME_IDS.map((id) => ({
  id,
  label: SLIDE_THEMES[id].label,
  descricao: SLIDE_THEMES[id].descricao,
  preview: SLIDE_THEMES[id].preview,
  dark: SLIDE_THEMES[id].dark,
}));
