import type {
  InclusaoEducationLevel,
  InclusaoModeId,
  InclusaoNeedId,
} from "@/lib/inclusao/inclusao-config";
import { getInclusaoModeLabel, getInclusaoNeedLabel } from "@/lib/inclusao/inclusao-config";

const NEED_TECHNIQUES: Record<InclusaoNeedId, string> = {
  tea: [
    "Rotinas previsíveis e antecipação de mudanças",
    "Instruções curtas, literais e sequenciais",
    "Apoios visuais ( pictogramas, cronogramas, primeiro–depois )",
    "Redução de estímulos sensoriais na proposta",
    "Tempo extra e pausas regulares",
    "Interesses restritos como gancho motivacional quando pertinente",
  ].join("; "),
  tdah: [
    "Fragmentação em passos curtos ( chunking )",
    "Checklists e timers visuais",
    "Movimento permitido e pausas ativas",
    "Feedback imediato e reforço positivo",
    "Instruções em uma ação por vez",
    "Ambiente com menos distrações na atividade",
  ].join("; "),
  dislexia: [
    "Textos com fonte legível, espaçamento amplo e parágrafos curtos",
    "Redução de carga de leitura sem perder objetivo",
    "Apoio multimodal ( oral, visual, auditivo )",
    "Organização por tópicos e cores",
    "Evitar blocos densos de texto",
    "Tempo extra para leitura e produção escrita",
  ].join("; "),
  "deficiencia-intelectual": [
    "Linguagem concreta e exemplos do cotidiano",
    "Simplificação progressiva mantendo o objetivo",
    "Apoio visual e manipuláveis quando possível",
    "Repetição espaçada e prática guiada",
    "Avaliação adaptada ao que o estudante pode demonstrar",
    "Metas parciais e celebração de avanços",
  ].join("; "),
  "altas-habilidades": [
    "Complexificação e aprofundamento do conteúdo",
    "Problemas abertos e investigação",
    "Extensão além do currículo básico",
    "Ritmo acelerado com autonomia",
    "Produtos criativos ou interdisciplinares",
    "Evitar tarefas repetitivas sem desafio",
  ].join("; "),
};

export const INCLUSAO_SYSTEM_INSTRUCTION = `Você é especialista em psicopedagogia e educação inclusiva no contexto escolar brasileiro.
Produza conteúdo pedagógico de alta qualidade, em português do Brasil, em markdown limpo.
Use títulos ## e ###, listas com -, negrito com ** quando necessário.
Não mencione IA, prompts, modelos ou bastidores técnicos.
Respeite a BNCC e práticas inclusivas éticas — adapte sem infantilizar indevidamente nem reduzir expectativas sem fundamento.`;

function modeInstructions(mode: InclusaoModeId): string {
  switch (mode) {
    case "adaptacao":
      return `Modo: Adaptação de Atividades.
Adapte o material original preservando o objetivo de aprendizagem.
Inclua: versão adaptada completa, justificativas pedagógicas breves, adaptações de avaliação quando couber, e sugestões de apoio em sala.
Estruture com ## Material adaptado, ## Adaptações realizadas, ## Avaliação adaptada (se aplicável), ## Orientações ao professor.`;
    case "trilhas":
      return `Modo: Trilhas Paralelas.
A partir do mesmo conteúdo, produza 2 ou 3 trilhas claramente rotuladas para a mesma turma inclusiva.
Use títulos ## Nível 1 — Acesso, ## Nível 2 — Intermediário, ## Nível 3 — Aprofundamento ( omita níveis se o conteúdo não comportar três ).
Cada nível deve ter atividades equivalentes em objetivo, com complexidade graduada.
Inclua ## Orientações de uso em sala com mediação entre os níveis.`;
    case "relatorio":
      return `Modo: Relatório de Progresso.
Com base nas observações do professor, redija relatório formal para coordenação pedagógica e família.
Tom: pedagógico, respeitoso, objetivo, sem diagnóstico clínico.
Estruture com ## Identificação ( genérica, sem nomes reais ), ## Contexto observado, ## Desempenho e participação, ## Comportamentos e mediações, ## Avanços registrados, ## Desafios atuais, ## Encaminhamentos e recomendações.
Use linguagem inclusiva e focada em potencialidades.`;
    case "mediacao":
      return `Modo: Dicas de Mediação.
Forneça práticas de mediação pedagógica acionáveis para o professor em sala.
Estruture com ## Estratégias imediatas, ## Organização do ambiente, ## Comunicação e instruções, ## Avaliação e registro, ## Articulação com família e equipe.
Se houver material original, relacione as dicas a ele; caso contrário, foque na necessidade e etapa informadas.`;
    default:
      return "";
  }
}

export function buildInclusaoPrompt(params: {
  mode: InclusaoModeId;
  need: InclusaoNeedId;
  educationLevel: InclusaoEducationLevel;
  content: string;
  observacoes?: string;
}): string {
  const needLabel = getInclusaoNeedLabel(params.need);
  const modeLabel = getInclusaoModeLabel(params.mode);
  const techniques = NEED_TECHNIQUES[params.need];

  const contentBlock =
    params.mode === "relatorio"
      ? `Observações do professor sobre o estudante:\n${params.content.trim()}`
      : params.content.trim()
        ? `Conteúdo original:\n${params.content.trim()}`
        : "Conteúdo original: (não informado — produza orientações gerais para a necessidade e etapa.)";

  const extras = params.observacoes?.trim()
    ? `\nObservações adicionais do professor:\n${params.observacoes.trim()}`
    : "";

  return `${modeInstructions(params.mode)}

Necessidade educacional: ${needLabel}
Técnicas prioritárias para esta necessidade: ${techniques}
Etapa de ensino: ${params.educationLevel}
Ferramenta: ${modeLabel}

${contentBlock}${extras}

Gere o resultado completo em markdown, pronto para o professor usar.`;
}
