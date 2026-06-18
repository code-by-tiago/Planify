import fs from "node:fs";
import path from "node:path";

/** Diretório dos modelos DOCX usados pelo motor de exportação. */
export const OFFICIAL_PLANNING_TEMPLATES_DIR = path.join(
  process.cwd(),
  "data",
  "modelos-oficiais",
);

/** Referências de qualidade — exemplos a serem preservados e usados em QA. */
export const OFFICIAL_PLANNING_REFERENCES_DIR = path.join(
  OFFICIAL_PLANNING_TEMPLATES_DIR,
  "referencias",
);

export const OFFICIAL_PLANNING_TEMPLATE_FILES = {
  anual: "modelo-anual.docx",
  trimestral: "modelo-trimestral.docx",
} as const;

/**
 * Referências canônicas do projeto (não sobrescrever sem revisão pedagógica):
 * - anualPreenchido: MODELO-PRONTO-ANUAL — padrão de preenchimento anual
 * - trimestralModelo: modelo-trimestral oficial com placeholders Matriz 2026
 */
export const OFFICIAL_PLANNING_REFERENCE_FILES = {
  anualPreenchido: "anual-preenchido.docx",
  trimestralModelo: "trimestral-modelo.docx",
} as const;

export type OfficialPlanningTemplateTipo = keyof typeof OFFICIAL_PLANNING_TEMPLATE_FILES;

export function getOfficialPlanningTemplatePath(tipo: OfficialPlanningTemplateTipo): string {
  const file = path.join(OFFICIAL_PLANNING_TEMPLATES_DIR, OFFICIAL_PLANNING_TEMPLATE_FILES[tipo]);

  if (!fs.existsSync(file)) {
    throw new Error(
      `Modelo oficial ${tipo} não encontrado em data/modelos-oficiais (${file}). ` +
        `Execute: node scripts/sync-planning-reference-templates.mjs`,
    );
  }

  return file;
}

export function getOfficialPlanningReferencePath(
  key: keyof typeof OFFICIAL_PLANNING_REFERENCE_FILES,
): string {
  return path.join(OFFICIAL_PLANNING_REFERENCES_DIR, OFFICIAL_PLANNING_REFERENCE_FILES[key]);
}
