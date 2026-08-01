import type { MaterialAIInput } from "../../types/ai";

type KnowledgeSource = {
  id: string;
  nome: string;
  categoria: "curriculo" | "licenca" | "repositorio" | "metodologia" | "avaliacao";
  usoNoPlanify: string;
  regraDeUso: string;
};

const TRUSTED_SOURCES: KnowledgeSource[] = [
  {
    id: "bncc-mec",
    nome: "BNCC / MEC",
    categoria: "curriculo",
    usoNoPlanify: "Alinhamento curricular, competências, habilidades, progressão por etapa e componente.",
    regraDeUso: "Usar como referência curricular. Não inventar códigos BNCC e não citar habilidade sem base oficial.",
  },
  {
    id: "mec-red-rea",
    nome: "MEC RED / Recursos Educacionais Digitais",
    categoria: "repositorio",
    usoNoPlanify: "Padrões de recursos educacionais digitais, metadados, reuso e organização de materiais.",
    regraDeUso: "Usar apenas como referência estrutural e de curadoria. Não copiar conteúdo protegido.",
  },
  {
    id: "unesco-oer",
    nome: "UNESCO / Recursos Educacionais Abertos",
    categoria: "licenca",
    usoNoPlanify: "Critérios para uso, adaptação, redistribuição e ética de recursos educacionais abertos.",
    regraDeUso: "Priorizar domínio público, licença aberta e material autorizado; gerar conteúdo original.",
  },
  {
    id: "creative-commons",
    nome: "Creative Commons",
    categoria: "licenca",
    usoNoPlanify: "Regras de atribuição, adaptação, compartilhamento e limites de uso de obras abertas.",
    regraDeUso: "Respeitar licença, atribuição, restrições de uso comercial e compartilhamento pela mesma licença quando houver.",
  },
  {
    id: "udl-cast",
    nome: "Design Universal para Aprendizagem",
    categoria: "metodologia",
    usoNoPlanify: "Clareza, acessibilidade, múltiplas formas de representação, ação, expressão e engajamento.",
    regraDeUso: "Converter complexidade em instruções claras, exemplos, tópicos, apoio visual e adaptações inclusivas.",
  },
  {
    id: "bloom-revisada",
    nome: "Taxonomia de Bloom revisada",
    categoria: "avaliacao",
    usoNoPlanify: "Variedade cognitiva: lembrar, compreender, aplicar, analisar, avaliar e criar.",
    regraDeUso: "Não gerar apenas perguntas fáceis; combinar níveis de complexidade conforme ano/série e finalidade.",
  },
];

function normalize(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function normalizeConteudos(conteudos: MaterialAIInput["conteudos"]): string[] {
  if (Array.isArray(conteudos)) return conteudos.map((item) => String(item).trim()).filter(Boolean);
  return String(conteudos || "")
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function familyFromComponent(component: string): string {
  const value = normalize(component);
  if (value.includes("matematica") || value.includes("fisica") || value.includes("quimica")) return "raciocínio, procedimentos, problemas e explicação de estratégias";
  if (value.includes("biologia") || value.includes("ciencias")) return "investigação, fenômenos, evidências, conceitos científicos e relações causa-consequência";
  if (value.includes("geografia")) return "território, paisagem, escala, lugar, redes, ambiente, sociedade e leitura espacial";
  if (value.includes("historia")) return "temporalidade, fontes, processos históricos, sujeitos, permanências, rupturas e memória";
  if (value.includes("filosofia") || value.includes("sociologia")) return "conceitos, problemas, argumentos, debate, análise crítica e aplicação social";
  if (value.includes("portuguesa") || value.includes("redacao") || value.includes("redacao") || value.includes("escrita")) return "leitura, linguagem, interpretação, produção, reescrita, argumentação e análise textual";
  if (value.includes("inglesa") || value.includes("espanhola")) return "vocabulário, comunicação, leitura, cultura, prática guiada e produção linguística";
  if (value.includes("religioso")) return "valores, diversidade, narrativas, convivência, respeito, reflexão ética e diálogo";
  if (value.includes("arte")) return "fruição, criação, linguagem artística, contexto cultural, repertório e produção";
  if (value.includes("educacao fisica")) return "práticas corporais, regras, estratégia, cuidado, cooperação e reflexão sobre movimento";
  return "conceitos centrais, exemplos, aplicação, síntese e produção de aprendizagem";
}

function depthByLevel(level: string, grade: string) {
  const etapa = normalize(level);
  const serie = normalize(grade);

  if (etapa.includes("infantil")) {
    return "linguagem oral, exploração sensorial, brincadeira, registro simples, interação e observação";
  }

  if (["1", "2", "3"].some((year) => serie.includes(`${year}o ano`) || serie.includes(`${year}º ano`))) {
    return "comandos curtos, exemplos concretos, imagens sugeridas, atividades passo a passo e registro acessível";
  }

  if (["4", "5"].some((year) => serie.includes(`${year}o ano`) || serie.includes(`${year}º ano`))) {
    return "conceitos claros, leitura orientada, comparação, resolução, explicação curta e produção guiada";
  }

  if (["6", "7"].some((year) => serie.includes(`${year}o ano`) || serie.includes(`${year}º ano`))) {
    return "conceitos organizados, exemplos contextualizados, exercícios progressivos, justificativa e síntese";
  }

  if (["8", "9"].some((year) => serie.includes(`${year}o ano`) || serie.includes(`${year}º ano`))) {
    return "análise, comparação, argumentação, problemas contextualizados, leitura crítica e produção autoral";
  }

  if (etapa.includes("medio")) {
    return "aprofundamento conceitual, repertório, análise crítica, interpretação de dados, argumentação e aplicação em situações complexas";
  }

  return "progressão adequada à turma, clareza, prática e avaliação formativa";
}

function deliveryByType(type: string) {
  const value = normalize(type);
  if (value === "atividade") return "folha de atividade com versão do aluno, questões numeradas, comandos objetivos, tópicos e gabarito do professor";
  if (value === "lista") return "lista de exercícios graduada, com blocos básico, intermediário e desafio, todos numerados e com gabarito comentado";
  if (value === "prova") return "avaliação pronta para aplicar, cabeçalho, instruções breves, pontuação sugerida, questões objetivas/discursivas e gabarito";
  if (value === "revisao") return "revisão guiada com síntese curta, retomada dos pontos essenciais, exercícios e autoavaliação";
  if (value === "apostila") return "apostila em formato de pequeno livro: capa textual, unidades, explicações, exemplos, boxes, vocabulário, síntese, exercícios e gabarito";
  if (value === "sequencia") return "sequência didática em aulas/momentos, com objetivos, recursos, desenvolvimento, evidências e avaliação";
  if (value === "projeto") return "projeto investigativo com problema norteador, etapas, produto final, socialização, rubrica e avaliação";
  if (value === "roteiro") return "roteiro de estudo autônomo com antes, durante, depois, autoavaliação e checagem de aprendizagem";
  if (value === "jogo") return "jogo pedagógico aplicável, com regras, peças/cartas/pistas/perguntas, modo de jogar e gabarito";
  return "material pedagógico organizado, original e pronto para uso";
}

function bloomFrame(type: string) {
  const value = normalize(type);
  if (["prova", "lista", "atividade", "revisao"].includes(value)) {
    return [
      "lembrar: recuperar conceitos essenciais sem decorar mecanicamente",
      "compreender: explicar, classificar, identificar e interpretar",
      "aplicar: resolver, reescrever, usar procedimento ou analisar situação",
      "analisar: comparar, justificar, distinguir causa/consequência ou estrutura",
      "avaliar/criar: defender resposta, propor solução, produzir síntese ou texto curto quando adequado",
    ];
  }

  if (value === "apostila") {
    return [
      "explicar conceitos antes da prática",
      "apresentar exemplos contextualizados",
      "propor atividades de fixação e aplicação",
      "fechar com síntese, glossário e revisão",
    ];
  }

  if (value === "projeto") {
    return ["investigar", "planejar", "produzir", "socializar", "avaliar processo e produto final"];
  }

  return ["compreender", "aplicar", "analisar", "produzir evidência de aprendizagem"];
}

export function buildKnowledgeEnginePrompt(input: MaterialAIInput): string {
  const conteudos = normalizeConteudos(input.conteudos);
  const sourceLines = TRUSTED_SOURCES.map(
    (source) => `- ${source.nome}: ${source.usoNoPlanify} Regra: ${source.regraDeUso}`,
  ).join("\n");

  const componentFrame = familyFromComponent(input.componenteCurricular);
  const depth = depthByLevel(input.etapa, input.anoSerie);
  const delivery = deliveryByType(String(input.tipo || ""));
  const bloom = bloomFrame(String(input.tipo || "")).map((item) => `- ${item}`).join("\n");
  const contentLines = conteudos.length ? conteudos.map((item) => `- ${item}`).join("\n") : "- Use o tema central para construir conteúdos específicos e coerentes.";

  return `
PLANIFY KNOWLEDGE ENGINE — BASE DE ENTREGA PEDAGÓGICA:
Este bloco não autoriza copiar conteúdo protegido da web. Ele orienta a IA a produzir material original a partir de padrões pedagógicos seguros, fontes abertas e estruturas reais de ensino.

FONTES E CRITÉRIOS CURADOS:
${sourceLines}

INTERPRETAÇÃO CURRICULAR DO PEDIDO:
- Componente curricular: ${input.componenteCurricular}
- Lógica disciplinar obrigatória: ${componentFrame}
- Etapa e ano/série: ${input.etapa} / ${input.anoSerie}
- Profundidade esperada: ${depth}
- Tipo de produto: ${input.tipo}
- Forma de entrega obrigatória: ${delivery}

CONTEÚDOS QUE DEVEM APARECER NO MATERIAL:
${contentLines}

VARIEDADE COGNITIVA ESPERADA:
${bloom}

REGRAS DE USO DA WEB COMO CONHECIMENTO:
1. Use a web e fontes educacionais apenas como inspiração estrutural, curricular e metodológica.
2. Não copie textos, questões, apostilas, provas, livros ou atividades protegidas.
3. Gere conteúdo original, com voz própria do Planify, adequado ao professor e à turma.
4. Quando o professor pedir pesquisa, referências ou aprofundamento, prefira fontes oficiais, domínio público, licença aberta ou materiais autorizados.
5. O material final não deve expor bastidores de licença, prompt, fonte interna ou validação técnica; ele deve parecer produto pedagógico pronto.
6. Se houver dúvida factual em tema muito específico, formule de modo responsável e evite afirmar dado duvidoso como certeza.
7. Transforme conhecimento em produto: tópicos, questões, capítulos, gabarito, rubrica, espaços de resposta e materiais aplicáveis.
`.trim();
}

export function getKnowledgeSourceSummary(): string[] {
  return TRUSTED_SOURCES.map((source) => `${source.nome}: ${source.usoNoPlanify}`);
}
