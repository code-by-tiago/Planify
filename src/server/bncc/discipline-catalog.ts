import "server-only";

/** User-facing disciplines that map to broader BNCC catalog subjects. */
export const DISCIPLINE_TO_BNCC_SUBJECTS: Record<string, string[]> = {
  fisica: ["Ciências da Natureza e suas Tecnologias"],
  quimica: ["Ciências da Natureza e suas Tecnologias"],
  biologia: ["Ciências da Natureza e suas Tecnologias"],
  ciencias: ["Ciências"],
  redacao: ["Língua Portuguesa", "Linguagens e suas Tecnologias"],
  "escrita criativa": ["Língua Portuguesa", "Linguagens e suas Tecnologias"],
  "lingua espanhola": ["Língua Inglesa", "Linguagens e suas Tecnologias"],
  espanhol: ["Língua Inglesa", "Linguagens e suas Tecnologias"],
  espanhola: ["Língua Inglesa", "Linguagens e suas Tecnologias"],
};

/** Ensures tool/progress pickers list common Planify components missing from bncc_skills.subject. */
export const EXTRA_CATALOG_SUBJECTS = [
  "Física",
  "Química",
  "Redação",
  "Escrita Criativa",
  "Língua Espanhola",
  "Espanhol",
] as const;

export const DEFAULT_SCHOOL_YEAR = 2026;

export function normalizeDisciplineKey(value: string | null | undefined): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function resolveBnccCatalogSubjects(
  discipline: string | null | undefined,
): string[] {
  const trimmed = String(discipline || "").trim();
  if (!trimmed) return [];

  const aliases = DISCIPLINE_TO_BNCC_SUBJECTS[normalizeDisciplineKey(trimmed)];
  if (aliases?.length) {
    return Array.from(new Set([trimmed, ...aliases]));
  }

  return [trimmed];
}

function catalogSubjectKeys(discipline: string | null | undefined): Set<string> {
  return new Set(
    resolveBnccCatalogSubjects(discipline).map((subject) =>
      normalizeDisciplineKey(subject),
    ),
  );
}

/** True when stored material discipline matches a progress filter (handles Redação ↔ LP aliases). */
export function matchesDisciplineFilter(
  stored: string | null | undefined,
  filter: string | null | undefined,
): boolean {
  const expected = String(filter || "").trim();
  if (!expected) return true;

  const actual = String(stored || "").trim();
  if (!actual) return false;

  if (actual.localeCompare(expected, "pt-BR", { sensitivity: "accent" }) === 0) {
    return true;
  }

  const expectedKeys = catalogSubjectKeys(expected);
  const actualKeys = catalogSubjectKeys(actual);

  for (const key of actualKeys) {
    if (expectedKeys.has(key)) return true;
  }

  return false;
}

export function resolveSchoolYear(
  payload?: Record<string, unknown> | null,
): number {
  const candidates = [
    payload?.anoLetivo,
    payload?.ano_letivo,
    payload?.schoolYear,
    payload?.school_year,
    payload?.year,
  ];

  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isInteger(value) && value >= 2000 && value <= 2100) {
      return value;
    }
  }

  return DEFAULT_SCHOOL_YEAR;
}
