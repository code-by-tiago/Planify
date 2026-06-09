import type { PlanningMatrixItem } from "@/server/planejamentos/planning-ai-service";

const MATERIAL_KEYWORDS =
  /caderno|ficha|material impresso|texto de apoio|cartolina|papel|cola|lápis|lapis|caneta|caderno|folha|impresso|livro didático|livro didatico/gi;

const RESOURCE_KEYWORDS =
  /quadro|projetor|slides|computador|internet|lousa|datashow|laboratório|laboratorio|sala|recurso digital|plataforma|vídeo|video|áudio|audio/gi;

export function deriveMateriaisFromRecursos(recursos: string): string {
  const text = String(recursos || "").trim();
  if (!text) {
    return "Caderno, fichas de atividade, material impresso e textos de apoio.";
  }

  const parts = text
    .split(/[,;]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);

  const materiais = parts.filter((part) => MATERIAL_KEYWORDS.test(part));
  if (materiais.length > 0) {
    return materiais.join(", ");
  }

  return "Caderno, fichas de atividade, material impresso e textos de apoio.";
}

export function deriveRecursosFromText(recursos: string, materiais: string): string {
  const text = String(recursos || "").trim();
  if (!text) {
    return "Quadro, projetor, livro didático e recursos digitais disponíveis.";
  }

  const parts = text
    .split(/[,;]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);

  const recursosOnly = parts.filter(
    (part) => RESOURCE_KEYWORDS.test(part) && !materiais.includes(part),
  );

  if (recursosOnly.length > 0) {
    return recursosOnly.join(", ");
  }

  return text;
}

export function deriveEtapasFromMetodologia(metodologia: string): string {
  const text = String(metodologia || "").trim();
  if (!text) {
    return "";
  }

  const bySentence = text
    .split(/(?<=[.;])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 8);

  if (bySentence.length >= 2) {
    return bySentence
      .map((step, index) => `${index + 1}. ${step.replace(/\.$/, "")}`)
      .join("\n");
  }

  const byComma = text
    .split(/,\s*/)
    .map((part) => part.trim())
    .filter((part) => part.length > 8);

  if (byComma.length >= 2) {
    return byComma
      .map((step, index) => `${index + 1}. ${step}`)
      .join("\n");
  }

  return `1. Contextualização e mobilização de conhecimentos prévios.\n2. ${text}\n3. Registro, socialização e síntese das aprendizagens.`;
}

export function enrichTrimestralMatrixItem(
  item: PlanningMatrixItem,
): PlanningMatrixItem {
  const materiais =
    String(item.materiais || "").trim() ||
    deriveMateriaisFromRecursos(item.recursos);
  const recursos = deriveRecursosFromText(item.recursos, materiais);
  const etapas =
    String(item.etapas || "").trim() ||
    deriveEtapasFromMetodologia(item.metodologia);

  return {
    ...item,
    materiais,
    recursos,
    etapas,
  };
}

export function formatMateriaisRecursosNecessarios(item: PlanningMatrixItem): string {
  const enriched = enrichTrimestralMatrixItem(item);
  const materiais = enriched.materiais?.trim();
  const recursos = enriched.recursos?.trim();

  if (materiais && recursos && materiais !== recursos) {
    return `Materiais: ${materiais}\nRecursos necessários: ${recursos}`;
  }

  return materiais || recursos || "";
}

export function formatExperienciasAprendizagem(item: PlanningMatrixItem): string {
  const etapas = enrichTrimestralMatrixItem(item).etapas || "";
  const steps = etapas
    .split(/\n+/)
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  if (steps.length === 0) {
    return "Semanas 1 a 5: desenvolvimento progressivo da experiência com atividades, registros e devolutivas.";
  }

  const weeks = [1, 2, 3, 4, 5].map((week, index) => {
    const step = steps[index] || steps[steps.length - 1] || "Consolidação e avaliação formativa.";
    return `Semana ${week}: ${step}`;
  });

  return weeks.join("\n");
}
