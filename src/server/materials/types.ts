/**
 * Contrato universal de tipagem — TODAS as ferramentas do iaplanify.com.br
 * devem retornar exclusivamente MaterialLayout (JSON estruturado).
 *
 * O Gemini NÃO pode devolver markdown, HTML, saudações ou texto fora deste schema.
 */

// ---------------------------------------------------------------------------
// Ferramentas (16 geradores Planify)
// ---------------------------------------------------------------------------

export const TIPO_FERRAMENTA_VALUES = [
  "slides",
  "prova",
  "lista",
  "plano-aula",
  "sequencia",
  "apostila",
  "atividade",
  "jogo",
  "projeto",
  "resumo",
  "flashcards",
  "redacao",
  "mapa-mental",
  "inclusao",
  "aula-completa",
  "correcao-ia",
] as const;

export type TipoFerramenta = (typeof TIPO_FERRAMENTA_VALUES)[number];

export const SECAO_TIPO_VALUES = ["texto", "tabela", "questoes", "slide"] as const;

export type SecaoTipo = (typeof SECAO_TIPO_VALUES)[number];

// ---------------------------------------------------------------------------
// Metadados obrigatórios
// ---------------------------------------------------------------------------

export type MaterialMetadata = {
  tema: string;
  serie: string;
  habilidadeBNCC: string;
  codigoBNCC: string;
};

// ---------------------------------------------------------------------------
// Conteúdo tipado por seção
// ---------------------------------------------------------------------------

export type TextoConteudo = {
  paragrafos?: string[];
  bullets?: string[];
};

export type TabelaConteudo = {
  /** Cabeçalhos da tabela (ex.: Etapa | Duração | Atividade) */
  cabecalhos: string[];
  /** Linhas — cada linha com o mesmo número de colunas que cabecalhos */
  linhas: string[][];
};

export type QuestaoAlternativa = {
  letra: "A" | "B" | "C" | "D" | "E";
  texto: string;
};

export type QuestaoItem = {
  numero: number;
  enunciado: string;
  tipo: "multipla-escolha" | "verdadeiro-falso" | "dissertativa" | "completar";
  alternativas?: QuestaoAlternativa[];
  /** Letra da alternativa correta (A–E) ou resposta objetiva curta */
  respostaCorreta: string;
  /** Justificativa pedagógica curta (máx. 120 caracteres) */
  justificativa: string;
};

export type QuestoesConteudo = {
  questoes: QuestaoItem[];
};

export type SlideItem = {
  titulo: string;
  /** Máximo 4 tópicos escaneáveis por slide */
  topicos: string[];
  notasProfessor?: string;
  layout?: "capa" | "conteudo" | "duasColunas" | "destaque" | "fechamento";
  /** Termos concretos para busca de imagem real (slides de conteúdo) */
  imagePrompt?: string;
};

export type SlideConteudo = {
  slides: SlideItem[];
};

export type SecaoConteudo =
  | TextoConteudo
  | TabelaConteudo
  | QuestoesConteudo
  | SlideConteudo;

export type MaterialSecao = {
  titulo: string;
  tipo: SecaoTipo;
  conteudo: SecaoConteudo;
};

/** Schema raiz — única forma de saída aceita pelo motor unificado. */
export type MaterialLayout = {
  metadata: MaterialMetadata;
  secoes: MaterialSecao[];
};

// ---------------------------------------------------------------------------
// Entrada do motor (RAG BNCC vindo do Supabase)
// ---------------------------------------------------------------------------

export type BnccSkillAnchor = {
  codigo: string;
  descricao: string;
  conteudo?: string;
};

export type PromptEngineInput = {
  tipoFerramenta: TipoFerramenta;
  etapa: string;
  anoSerie: string;
  componenteCurricular: string;
  tema: string;
  objetivo?: string;
  quantidade: number;
  dificuldade: string;
  incluirGabarito?: boolean;
  incluirQuestoes?: boolean;
  quantidadeQuestoes?: number;
  designSlides?: string;
  modeloSlides?: string;
  formatoJogo?: string | null;
  observacoes?: string;
  /** Habilidades BNCC confirmadas pelo professor — texto literal do banco (RAG) */
  habilidadesBncc?: BnccSkillAnchor[];
};

// ---------------------------------------------------------------------------
// Resultado da validação
// ---------------------------------------------------------------------------

export type ValidationResult =
  | { ok: true; layout: MaterialLayout }
  | { ok: false; issues: string[]; sanitizedRaw?: string };

export type ValidatorInterceptResult =
  | { accepted: true; layout: MaterialLayout }
  | {
      accepted: false;
      issues: string[];
      retryScheduled: boolean;
      sanitizedRaw: string;
    };

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isTipoFerramenta(value: string): value is TipoFerramenta {
  return (TIPO_FERRAMENTA_VALUES as readonly string[]).includes(value);
}

export function isSecaoTipo(value: string): value is SecaoTipo {
  return (SECAO_TIPO_VALUES as readonly string[]).includes(value);
}

export function isTextoConteudo(
  conteudo: SecaoConteudo,
  tipo: SecaoTipo,
): conteudo is TextoConteudo {
  return tipo === "texto";
}

export function isTabelaConteudo(
  conteudo: SecaoConteudo,
  tipo: SecaoTipo,
): conteudo is TabelaConteudo {
  return tipo === "tabela";
}

export function isQuestoesConteudo(
  conteudo: SecaoConteudo,
  tipo: SecaoTipo,
): conteudo is QuestoesConteudo {
  return tipo === "questoes";
}

export function isSlideConteudo(
  conteudo: SecaoConteudo,
  tipo: SecaoTipo,
): conteudo is SlideConteudo {
  return tipo === "slide";
}

/** JSON Schema descritivo para responseSchema do Gemini. */
export const MATERIAL_LAYOUT_JSON_SCHEMA = {
  type: "object",
  required: ["metadata", "secoes"],
  properties: {
    metadata: {
      type: "object",
      required: ["tema", "serie", "habilidadeBNCC", "codigoBNCC"],
      properties: {
        tema: { type: "string" },
        serie: { type: "string" },
        habilidadeBNCC: { type: "string" },
        codigoBNCC: { type: "string" },
      },
    },
    secoes: {
      type: "array",
      items: {
        type: "object",
        required: ["titulo", "tipo", "conteudo"],
        properties: {
          titulo: { type: "string" },
          tipo: { type: "string", enum: [...SECAO_TIPO_VALUES] },
          conteudo: { type: "object" },
        },
      },
    },
  },
} as const;
