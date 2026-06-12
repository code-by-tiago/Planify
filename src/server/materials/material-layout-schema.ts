/**
 * Schema Gemini (responseSchema) para MaterialLayout — motor unificado.
 */

export const METADATA_SCHEMA = {
  type: "OBJECT",
  properties: {
    tema: { type: "STRING" },
    serie: { type: "STRING" },
    habilidadeBNCC: { type: "STRING" },
    codigoBNCC: { type: "STRING" },
  },
  required: ["tema", "serie", "habilidadeBNCC", "codigoBNCC"],
};

const ALTERNATIVA_SCHEMA = {
  type: "OBJECT",
  properties: {
    letra: { type: "STRING", enum: ["A", "B", "C", "D", "E"] },
    texto: { type: "STRING" },
  },
  required: ["letra", "texto"],
};

const QUESTAO_SCHEMA = {
  type: "OBJECT",
  properties: {
    numero: { type: "INTEGER" },
    enunciado: { type: "STRING" },
    tipo: {
      type: "STRING",
      enum: ["multipla-escolha", "verdadeiro-falso", "dissertativa", "completar"],
    },
    alternativas: { type: "ARRAY", items: ALTERNATIVA_SCHEMA },
    respostaCorreta: { type: "STRING" },
    justificativa: { type: "STRING" },
  },
  required: ["numero", "enunciado", "tipo", "respostaCorreta", "justificativa"],
};

const SLIDE_ITEM_SCHEMA = {
  type: "OBJECT",
  properties: {
    titulo: { type: "STRING" },
    topicos: { type: "ARRAY", items: { type: "STRING" } },
    notasProfessor: { type: "STRING" },
    layout: {
      type: "STRING",
      enum: ["capa", "conteudo", "duasColunas", "destaque", "fechamento"],
    },
    imagePrompt: { type: "STRING" },
  },
  required: ["titulo", "topicos"],
};

const CONTEUDO_SCHEMA = {
  type: "OBJECT",
  properties: {
    paragrafos: { type: "ARRAY", items: { type: "STRING" } },
    bullets: { type: "ARRAY", items: { type: "STRING" } },
    cabecalhos: { type: "ARRAY", items: { type: "STRING" } },
    linhas: {
      type: "ARRAY",
      items: { type: "ARRAY", items: { type: "STRING" } },
    },
    questoes: { type: "ARRAY", items: QUESTAO_SCHEMA },
    slides: { type: "ARRAY", items: SLIDE_ITEM_SCHEMA },
  },
};

const SECAO_SCHEMA = {
  type: "OBJECT",
  properties: {
    titulo: { type: "STRING" },
    tipo: { type: "STRING", enum: ["texto", "tabela", "questoes", "slide"] },
    conteudo: CONTEUDO_SCHEMA,
  },
  required: ["titulo", "tipo", "conteudo"],
};

export const MATERIAL_LAYOUT_GEMINI_SCHEMA = {
  type: "OBJECT",
  properties: {
    metadata: METADATA_SCHEMA,
    secoes: { type: "ARRAY", items: SECAO_SCHEMA },
  },
  required: ["metadata", "secoes"],
};

export function getMaterialLayoutSchema() {
  return MATERIAL_LAYOUT_GEMINI_SCHEMA;
}
