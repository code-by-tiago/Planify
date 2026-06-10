import { generateGeminiJSON } from "../ai/gemini-client";
import { resolveDisciplineTopicGuidance } from "@/lib/materiais/discipline-topic-seeds";
import type { MaterialEngineRequest, MaterialEngineType } from "./material-engine-types";

const OUTLINE_TYPES = new Set<MaterialEngineType>([
  "prova",
  "lista",
  "apostila",
  "plano-aula",
  "sequencia",
  "atividade",
  "slides",
  "resumo",
  "projeto",
  "redacao",
]);

type OutlineUnit = {
  title: string;
  objectives: string[];
  questionTypes: string[];
  mustMention: string[];
};

type PedagogicalOutline = {
  units: OutlineUnit[];
  coverageChecklist: string[];
  difficultyProgression: string;
};

const OUTLINE_SCHEMA = {
  type: "object",
  properties: {
    units: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          objectives: { type: "array", items: { type: "string" } },
          questionTypes: { type: "array", items: { type: "string" } },
          mustMention: { type: "array", items: { type: "string" } },
        },
        required: ["title", "objectives", "questionTypes", "mustMention"],
      },
    },
    coverageChecklist: { type: "array", items: { type: "string" } },
    difficultyProgression: { type: "string" },
  },
  required: ["units", "coverageChecklist", "difficultyProgression"],
} as const;

export function usesPedagogicalOutline(type: MaterialEngineType): boolean {
  return OUTLINE_TYPES.has(type);
}

function formatOutlineBlock(outline: PedagogicalOutline): string {
  const units = outline.units
    .map((unit, index) => {
      const objectives = unit.objectives.map((item) => `    - ${item}`).join("\n");
      const types = unit.questionTypes.map((item) => `    - ${item}`).join("\n");
      const mentions = unit.mustMention.map((item) => `    - ${item}`).join("\n");
      return [
        `${index + 1}. ${unit.title}`,
        "  Objetivos:",
        objectives,
        "  Tipos de questão/atividade:",
        types,
        "  Termos que DEVEM aparecer:",
        mentions,
      ].join("\n");
    })
    .join("\n\n");

  const checklist = outline.coverageChecklist.map((item) => `- ${item}`).join("\n");

  return `
CONTRATO PEDAGÓGICO (PASSO A — OBRIGATÓRIO NA REDAÇÃO FINAL):
Progressão de dificuldade: ${outline.difficultyProgression}

Unidades/blocos:
${units}

Checklist de cobertura (todos os itens devem estar no material final):
${checklist}

REGRA: a redação final (passo B) deve seguir este contrato. Não ignore unidades, não troque o tema por conteúdo genérico.
`.trim();
}

export async function buildPedagogicalOutlinePromptBlock(
  request: MaterialEngineRequest,
): Promise<string> {
  const discipline = resolveDisciplineTopicGuidance({
    tema: request.tema,
    componenteCurricular: request.componenteCurricular,
  });

  const disciplineBlock = discipline?.promptBlock ?? "";

  const prompt = `
Elabore um OUTLINE pedagógico (não o material final) para ${request.tipoMaterial} sobre "${request.tema}".
Componente: ${request.componenteCurricular}. Ano/série: ${request.anoSerie}.
Quantidade alvo de itens principais: ${request.quantidade}.
Dificuldade: ${request.dificuldade}.

${disciplineBlock}

O outline deve:
- Distribuir ${request.quantidade} itens em unidades coerentes
- Variar tipos de questão/atividade
- Garantir progressão fácil → médio → desafio
- Listar termos que cada bloco deve mencionar explicitamente
`.trim();

  const outline = await generateGeminiJSON<PedagogicalOutline>({
    systemInstruction:
      "Você é especialista pedagógico do Planify. Responda somente JSON no schema. O outline é contrato para a redação final.",
    prompt,
    cacheProfile: `material-engine:${request.tipoMaterial}`,
    tier: "default",
    temperature: 0.25,
    topP: 0.85,
    maxOutputTokens: 4096,
    responseSchema: OUTLINE_SCHEMA,
  });

  if (!outline?.units?.length) {
    return disciplineBlock
      ? `\n\n${disciplineBlock}`
      : "";
  }

  return [disciplineBlock, formatOutlineBlock(outline)].filter(Boolean).join("\n\n");
}
