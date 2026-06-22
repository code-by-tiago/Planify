import type { MaterialEngineInput } from "@/server/materials/material-engine-types";
import {
  requestMaterialGenerationStream,
  type MaterialStreamCallbacks,
  type MaterialStreamResult,
} from "@/lib/materiais/material-stream-client";
import { CRUZADINHA_GENERATION_TYPE } from "./cruzadinha-config";

export type CruzadinhaGenerationInput = {
  tema: string;
  etapa: string;
  anoSerie: string;
  componenteCurricular: string;
  areaConhecimento?: string;
  quantidade: string | number;
  dificuldade: string;
  palavrasOpcionais?: string;
  observacoes?: string;
  incluirGabarito?: boolean;
  classId?: string | null;
  className?: string | null;
  turma?: string | null;
  discipline?: string | null;
  disciplina?: string | null;
  idempotencyKey?: string;
};

function buildObservacoes(input: CruzadinhaGenerationInput): string | undefined {
  const parts: string[] = [];
  const palavras = input.palavrasOpcionais?.trim();
  if (palavras) {
    parts.push(`Palavras sugeridas pelo professor: ${palavras}`);
  }
  const obs = input.observacoes?.trim();
  if (obs) parts.push(obs);
  return parts.length ? parts.join("\n\n") : undefined;
}

export function buildCruzadinhaGenerationPayload(
  input: CruzadinhaGenerationInput,
): MaterialEngineInput {
  return {
    tipoMaterial: CRUZADINHA_GENERATION_TYPE,
    tipo: CRUZADINHA_GENERATION_TYPE,
    formatoJogo: "cruzadinha",
    etapa: input.etapa,
    anoSerie: input.anoSerie,
    componenteCurricular: input.componenteCurricular,
    componente: input.componenteCurricular,
    areaConhecimento: input.areaConhecimento,
    tema: input.tema,
    temaCentral: input.tema,
    objetivo: input.observacoes?.trim() || "",
    quantidade: input.quantidade,
    dificuldade: input.dificuldade,
    observacoes: buildObservacoes(input),
    incluirGabarito: input.incluirGabarito !== false,
    classId: input.classId,
    className: input.className,
    turma: input.turma,
    discipline: input.discipline,
    disciplina: input.disciplina,
    idempotencyKey: input.idempotencyKey,
  };
}

export async function requestCruzadinhaGeneration(
  input: CruzadinhaGenerationInput,
  callbacks: MaterialStreamCallbacks = {},
): Promise<MaterialStreamResult> {
  return requestMaterialGenerationStream(
    buildCruzadinhaGenerationPayload(input),
    callbacks,
  );
}
