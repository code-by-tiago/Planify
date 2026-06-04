import type { PlanningAiPayload } from "./planning-ai-service";

const MAX_FIELD_LENGTH = 240;
const MAX_TEXT_BLOCK_LENGTH = 4000;
const MAX_CONTENT_LINES = 24;
const MAX_SELECTED_SKILLS = 48;

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

export function splitPlanningConteudos(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => splitPlanningConteudos(item))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return normalizeText(value)
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isOversized(value: unknown, max: number): boolean {
  return normalizeText(value).length > max;
}

export function validatePlanningPayload(
  payload: PlanningAiPayload | null | undefined,
): string | null {
  if (!payload || typeof payload !== "object") {
    return "Dados do planejamento não foram enviados.";
  }

  if (!normalizeText(payload.etapa)) {
    return "Informe a etapa de ensino.";
  }

  if (!normalizeText(payload.anoSerie)) {
    return "Informe o ano ou série.";
  }

  if (!normalizeText(payload.componenteCurricular)) {
    return "Informe o componente curricular.";
  }

  const conteudos = splitPlanningConteudos(payload.conteudos);

  if (conteudos.length === 0) {
    return "Informe pelo menos um conteúdo (um por linha).";
  }

  if (conteudos.length > MAX_CONTENT_LINES) {
    return `Informe no máximo ${MAX_CONTENT_LINES} conteúdos.`;
  }

  for (const line of conteudos) {
    if (line.length > MAX_FIELD_LENGTH) {
      return "Cada conteúdo deve ter no máximo 240 caracteres.";
    }
  }

  const skills = Array.isArray(payload.habilidadesSelecionadas)
    ? payload.habilidadesSelecionadas
    : [];

  if (skills.length === 0) {
    return "Selecione pelo menos uma habilidade BNCC antes de gerar o planejamento.";
  }

  if (skills.length > MAX_SELECTED_SKILLS) {
    return `Selecione no máximo ${MAX_SELECTED_SKILLS} habilidades.`;
  }

  for (const skill of skills) {
    const codigo = normalizeText((skill as { codigo?: string }).codigo);
    const descricao = normalizeText(
      (skill as { descricao?: string }).descricao ||
        (skill as { habilidade?: string }).habilidade,
    );

    if (!codigo || !descricao) {
      return "Todas as habilidades selecionadas precisam ter código e descrição.";
    }
  }

  if (isOversized(payload.objetivosGerais, MAX_TEXT_BLOCK_LENGTH)) {
    return "Os objetivos gerais estão muito longos.";
  }

  if (isOversized(payload.observacoes, MAX_TEXT_BLOCK_LENGTH)) {
    return "As observações estão muito longas.";
  }

  return null;
}

export function validateBnccSuggestionPayload(
  payload: Record<string, unknown> | null | undefined,
): string | null {
  if (!payload || typeof payload !== "object") {
    return "Dados insuficientes para sugerir habilidades BNCC.";
  }

  if (!normalizeText(payload.etapa)) {
    return "Informe a etapa de ensino.";
  }

  if (!normalizeText(payload.anoSerie)) {
    return "Informe o ano ou série.";
  }

  if (!normalizeText(payload.componenteCurricular)) {
    return "Informe o componente curricular.";
  }

  const conteudos = splitPlanningConteudos(
    payload.conteudos ?? payload.conteudo ?? payload.contents,
  );

  if (conteudos.length === 0) {
    return "Informe pelo menos um conteúdo para sugerir habilidades BNCC.";
  }

  if (conteudos.length > MAX_CONTENT_LINES) {
    return `Informe no máximo ${MAX_CONTENT_LINES} conteúdos.`;
  }

  return null;
}
