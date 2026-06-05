import type { PlanejamentoAIInput, SelectedBNCCSkill } from "../../../types/ai";

function normalizeConteudos(conteudos: PlanejamentoAIInput["conteudos"]): string[] {
  if (Array.isArray(conteudos)) {
    return conteudos.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(conteudos)
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatSkills(skills: SelectedBNCCSkill[]): string {
  return skills
    .map((skill) => {
      return `- Código: ${skill.codigo}\n  Descrição oficial: ${skill.habilidade}`;
    })
    .join("\n");
}

export function buildPlanejamentoSystemInstruction(): string {
  return [
    "Você é uma IA pedagógica especialista em planejamento escolar brasileiro.",
    "Você trabalha para o SaaS Planify.",
    "Você deve gerar apenas planejamento pedagógico estruturado.",
    "Você nunca deve inventar códigos BNCC.",
    "Você nunca deve criar habilidades BNCC novas.",
    "Você só pode usar as habilidades BNCC enviadas em habilidadesSelecionadas.",
    "A descrição oficial das habilidades será preenchida pelo backend do Planify.",
    "No campo etapas[].habilidadesBnccCodigos, retorne somente os códigos puros, por exemplo: [\"EF15LP01\", \"EF35LP03\"].",
    "No campo etapas[].habilidadesBncc, retorne uma lista vazia. O backend preencherá com código + descrição oficial.",
    "Não escreva texto da habilidade dentro de etapas[].habilidadesBnccCodigos.",
    "Não inclua explicações fora do JSON.",
    "Não use markdown.",
    "Não use bloco de código.",
    "Retorne exclusivamente JSON válido.",
  ].join("\n");
}

export function buildPlanejamentoDynamicPrompt(input: PlanejamentoAIInput): string {
  const conteudos = normalizeConteudos(input.conteudos);
  const skills = input.habilidadesSelecionadas;

  return `
Gere um planejamento pedagógico estruturado para o Planify.

DADOS DO PROFESSOR:
Escola: ${input.escola}
Professor: ${input.professor}
Etapa: ${input.etapa}
Ano/Série: ${input.anoSerie}
Componente curricular: ${input.componenteCurricular}
Carga horária: ${input.cargaHoraria}
Tipo: ${input.tipo}
Trimestre: ${input.trimestre || "Não informado"}

CONTEÚDOS INFORMADOS:
${conteudos.map((conteudo) => `- ${conteudo}`).join("\n")}

OBJETIVOS INFORMADOS:
${input.objetivos || "Não informado"}

OBSERVAÇÕES INFORMADAS:
${input.observacoes || "Não informado"}

HABILIDADES BNCC OFICIAIS SELECIONADAS PELO PROFESSOR:
${formatSkills(skills)}
`.trim();
}

export function buildPlanejamentoPrompt(input: PlanejamentoAIInput): string {
  return `
${buildPlanejamentoDynamicPrompt(input)}

REGRAS OBRIGATÓRIAS:
1. Não invente nenhuma habilidade BNCC.
2. Não invente nenhum código BNCC.
3. Use somente os códigos BNCC listados acima.
4. Não repita a mesma habilidade em excesso.
5. Distribua os conteúdos em etapas pedagógicas coerentes.
6. Cada etapa deve conter conteúdos específicos.
7. Cada etapa deve citar apenas códigos BNCC recebidos.
8. No campo etapas[].habilidadesBnccCodigos, escreva somente códigos puros, sem dois-pontos e sem texto da habilidade.
9. No campo etapas[].habilidadesBncc, retorne [] porque o backend preencherá código + descrição oficial.
10. O planejamento deve ser profissional, claro, aplicável e adequado à etapa, ano/série e componente.
11. Não gere DOCX.
12. Não mencione que é uma simulação.
13. Não coloque texto em markdown.
14. Retorne somente JSON válido.

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
