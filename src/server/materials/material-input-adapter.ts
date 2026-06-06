import type { MaterialAIInput } from "@/types/ai";
import { buildElevateQualityObservacoes } from "@/lib/materiais/material-quality-score";
import type {
  MaterialEngineInput,
  MaterialEngineRequest,
} from "./material-engine-types";

function mapGameModel(formato: string | null | undefined): string | undefined {
  if (!formato) return undefined;
  const raw = formato.trim().toLowerCase().replace(/-/g, "_");
  if (raw === "trilha") return "trilha";
  if (
    [
      "caca_palavras",
      "cruzadinha",
      "bingo",
      "memoria",
      "domino",
      "quiz",
      "cartas",
      "trilha",
    ].includes(raw)
  ) {
    return raw;
  }
  return "caca_palavras";
}

function buildConteudos(
  request: MaterialEngineRequest,
  payload: MaterialEngineInput,
): string[] {
  const items = [
    request.tema,
    request.objetivo,
    typeof payload.observacoes === "string" ? payload.observacoes.trim() : "",
  ].filter(Boolean);

  return Array.from(new Set(items));
}

function buildObservacoes(
  request: MaterialEngineRequest,
  payload: MaterialEngineInput,
): string {
  const elevateNote =
    request.elevarQualidade || request.problemasQualidade?.length
      ? buildElevateQualityObservacoes(request.problemasQualidade ?? [])
      : "";

  const parts = [
    elevateNote,
    typeof payload.observacoes === "string" ? payload.observacoes.trim() : "",
    payload.turma || payload.className
      ? `Turma: ${String(payload.turma || payload.className).trim()}.`
      : "",
    `Quantidade solicitada: ${request.quantidade}.`,
    `Dificuldade: ${request.dificuldade}.`,
    request.incluirGabarito
      ? "Incluir gabarito, critérios de correção e respostas esperadas quando aplicável."
      : "Não incluir gabarito, respostas esperadas nem redação modelo.",
  ];

  return parts.filter(Boolean).join("\n\n");
}

function buildObjetivos(
  request: MaterialEngineRequest,
  payload: MaterialEngineInput,
): string {
  const fromPayload =
    typeof payload.objetivo === "string"
      ? payload.objetivo.trim()
      : typeof payload.objetivos === "string"
        ? payload.objetivos.trim()
        : request.objetivo;

  return fromPayload || request.objetivo;
}

function needsQuestionQuantity(tipo: string): boolean {
  return ["atividade", "prova", "lista", "revisao", "apostila"].includes(tipo);
}

export function engineRequestToMaterialAI(
  request: MaterialEngineRequest,
  payload: MaterialEngineInput = {},
): MaterialAIInput {
  const tipo = request.tipoMaterial;
  const conteudos = buildConteudos(request, payload);

  return {
    titulo: `${request.tema} — ${tipo}`,
    etapa: request.etapa,
    anoSerie: request.anoSerie,
    areaConhecimento:
      typeof payload.areaConhecimento === "string"
        ? payload.areaConhecimento
        : undefined,
    componenteCurricular: request.componenteCurricular,
    tipo,
    modeloJogo: mapGameModel(request.formatoJogo ?? undefined),
    tema: request.tema,
    quantidadeQuestoes: needsQuestionQuantity(tipo)
      ? String(request.quantidade)
      : tipo === "redacao"
        ? String(request.quantidade)
        : undefined,
    nivelAprofundamento: request.dificuldade,
    objetivos: buildObjetivos(request, payload),
    conteudos,
    orientacoes: buildObjetivos(request, payload),
    observacoes: buildObservacoes(request, payload),
    contextoTurma:
      typeof payload.turma === "string"
        ? payload.turma.trim()
        : typeof payload.className === "string"
          ? payload.className.trim()
          : undefined,
    criteriosAvaliacaoPersonalizados: request.incluirGabarito
      ? "Incluir critérios de avaliação detalhados e gabarito comentado."
      : "Sem gabarito na versão do aluno.",
  };
}
