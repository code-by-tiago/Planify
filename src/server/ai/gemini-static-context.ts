import { getKnowledgeSourceSummary } from "../../lib/materiais/material-knowledge-engine";
import {
  buildMaterialJsonSchemaContract,
  buildMaterialSystemInstruction,
  buildMaterialTypeRulesCatalog,
  buildMaterialUniversalRulesBlock,
} from "./prompts/material-prompt";
import { buildPlanejamentoSystemInstruction } from "./prompts/planejamento-prompt";
import { buildMaterialContentSuggestionSystemInstruction } from "./prompts/material-content-suggestion-prompt";
import {
  buildMaterialEngineSystemInstruction,
  buildMaterialEngineStaticRules,
} from "../materials/material-engine-prompts";
import type { MaterialEngineType } from "../materials/material-engine-types";

export type GeminiCacheProfile =
  | "material-json"
  | "planejamento-json"
  | "planning-matrix"
  | "material-suggestion"
  | `material-engine:${MaterialEngineType}`;

export function buildMaterialJsonStaticContext(): string {
  const sources = getKnowledgeSourceSummary()
    .map((line) => `- ${line}`)
    .join("\n");

  return `
PLANIFY — CONTEXTO PEDAGÓGICO ESTÁTICO (CACHE)
Este bloco contém regras, contratos e catálogos reutilizáveis. A solicitação dinâmica do professor virá depois.

FONTES CURADAS PLANIFY:
${sources}

${buildMaterialUniversalRulesBlock()}

CATÁLOGO DE REGRAS POR TIPO DE MATERIAL:
${buildMaterialTypeRulesCatalog()}

${buildMaterialJsonSchemaContract()}
`.trim();
}

export function buildPlanejamentoJsonStaticContext(): string {
  return `
PLANIFY — PLANEJAMENTO PEDAGÓGICO (CONTEXTO ESTÁTICO)

REGRAS OBRIGATÓRIAS:
1. Não invente nenhuma habilidade BNCC.
2. Não invente nenhum código BNCC.
3. Use somente os códigos BNCC enviados na solicitação dinâmica.
4. Não repita a mesma habilidade em excesso.
5. Distribua os conteúdos em etapas pedagógicas coerentes.
6. Cada etapa deve conter conteúdos específicos.
7. Cada etapa deve citar apenas códigos BNCC recebidos.
8. No campo etapas[].habilidadesBnccCodigos, escreva somente códigos puros, sem dois-pontos e sem texto da habilidade.
9. No campo etapas[].habilidadesBncc, retorne [] porque o backend preencherá código + descrição oficial.
10. O planejamento deve ser profissional, claro, aplicável e adequado à etapa, ano/série e componente.

FORMATO JSON EXATO:
{
  "titulo": "string",
  "resumo": "string",
  "dadosGerais": {
    "escola": "string",
    "professor": "string",
    "etapa": "string",
    "anoSerie": "string",
    "componenteCurricular": "string",
    "cargaHoraria": "string",
    "tipo": "string",
    "trimestre": "string"
  },
  "objetivosGerais": ["string"],
  "habilidadesBnccUtilizadas": [
    {
      "codigo": "string",
      "habilidade": "string",
      "componente": "string",
      "etapa": "string",
      "anoSerie": "string"
    }
  ],
  "conteudosOrganizados": ["string"],
  "metodologiaGeral": "string",
  "etapas": [
    {
      "titulo": "string",
      "descricao": "string",
      "conteudos": ["string"],
      "habilidadesBnccCodigos": ["EF15LP01"],
      "habilidadesBncc": [],
      "metodologia": "string",
      "recursos": ["string"],
      "avaliacao": "string",
      "evidencias": ["string"]
    }
  ],
  "recursosGerais": ["string"],
  "avaliacaoGeral": "string",
  "evidenciasDeAprendizagem": ["string"],
  "observacoesPedagogicas": ["string"],
  "proximosPassos": ["string"],
  "alertas": ["string"]
}
`.trim();
}

export function buildPlanningMatrixStaticContext(): string {
  return `
PLANIFY — MATRIZ DE PLANEJAMENTO ANUAL (CONTEXTO ESTÁTICO)

REGRAS OBRIGATÓRIAS:
1. Retorne uma matriz em planejamento.conteudos.
2. Cada item deve representar apenas um conteúdo.
3. Cada conteúdo deve ter no máximo 3 habilidades.
4. Use código e descrição completa das habilidades enviadas na solicitação dinâmica.
5. Não invente código BNCC se houver habilidade selecionada compatível.
6. Gere exatamente uma linha por conteúdo informado pelo professor.
7. numeroAula sequencial: 1 para o 1º conteúdo, 2 para o 2º, e assim por diante.
8. periodos variável por complexidade; a soma de periodos deve igualar a carga horária informada.
9. No planejamento anual, distribua os conteúdos entre 1º, 2º e 3º trimestre.
10. aulaInicio e aulaFim representam a faixa cumulativa de períodos.
11. Gere objetivos/expectativas de aprendizagem, metodologia, recursos, avaliação e evidências.
12. Preencha projetos interdisciplinares, temas integradores e instrumentos de avaliação de forma coerente quando estes campos existirem no DOCX.
13. Não use texto genérico vazio.

FORMATO JSON:
{
  "planejamento": {
    "tipoPlanejamento": "anual",
    "titulo": "...",
    "resumo": "...",
    "conteudos": [
      {
        "conteudo": "...",
        "trimestre": 1,
        "numeroAula": 1,
        "periodos": 5,
        "aulaInicio": 1,
        "aulaFim": 5,
        "habilidades": [
          { "codigo": "...", "descricao": "..." }
        ],
        "objetivos": "...",
        "metodologia": "...",
        "recursos": "...",
        "avaliacao": "...",
        "evidencias": "..."
      }
    ]
  }
}
`.trim();
}

export function resolveGeminiCacheBundle(
  profile: GeminiCacheProfile,
): { systemInstruction: string; staticContext?: string } | null {
  if (profile === "material-json") {
    return {
      systemInstruction: buildMaterialSystemInstruction(),
      staticContext: buildMaterialJsonStaticContext(),
    };
  }

  if (profile === "planejamento-json") {
    return {
      systemInstruction: buildPlanejamentoSystemInstruction(),
      staticContext: buildPlanejamentoJsonStaticContext(),
    };
  }

  if (profile === "planning-matrix") {
    return {
      systemInstruction: [
        "Você é uma IA especialista em planejamento pedagógico brasileiro.",
        "Responda somente com JSON válido, sem markdown nem texto fora do objeto.",
        "Use exclusivamente habilidades BNCC que o professor selecionou — nunca invente códigos genéricos.",
      ].join("\n"),
      staticContext: buildPlanningMatrixStaticContext(),
    };
  }

  if (profile === "material-suggestion") {
    return {
      systemInstruction: buildMaterialContentSuggestionSystemInstruction(),
      staticContext:
        "PLANIFY — MAPA PEDAGÓGICO INTERNO. Use padrões BNCC, Bloom, REA/OER e acessibilidade como referência estrutural. Gere blocos originais, específicos e integráveis em um único material.",
    };
  }

  if (profile.startsWith("material-engine:")) {
    const type = profile.replace("material-engine:", "") as MaterialEngineType;

    return {
      systemInstruction: buildMaterialEngineSystemInstruction(type),
      staticContext: buildMaterialEngineStaticRules(type),
    };
  }

  return null;
}
