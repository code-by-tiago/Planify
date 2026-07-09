import type {
  CopilotoBrief,
  CopilotoFieldConfidence,
} from "@/lib/copiloto/types";

export type CopilotoAssumption = {
  field: string;
  label: string;
  value: string;
  reason: string;
};

export type CopilotoPendingQuestion = {
  id: "anoSerie" | "quantidade" | "etapa" | "tema";
  question: string;
};

function conf(
  brief: CopilotoBrief,
  key: keyof NonNullable<CopilotoBrief["confianca"]>,
): CopilotoFieldConfidence | undefined {
  return brief.confianca?.[key];
}

/**
 * Premissas inteligentes + perguntas ativas quando o pedido veio incompleto.
 */
export function buildCopilotoGapFill(brief: CopilotoBrief): {
  assumptions: CopilotoAssumption[];
  pendingQuestions: CopilotoPendingQuestion[];
} {
  const assumptions: CopilotoAssumption[] = [];
  const pendingQuestions: CopilotoPendingQuestion[] = [];
  const transcript = `${brief.transcript} ${brief.conteudo}`.toLowerCase();

  const mentionedYear =
    /\d+\s*º\s*ano|\d+\s*ª\s*s[eé]rie|eja|ber[cç]ário|maternal|pr[eé]/i.test(
      transcript,
    );
  const mentionedQty = /\b\d+\s*(quest|exerc|item|per[ií]odo|texto)/i.test(
    transcript,
  );
  const mentionedTema =
    brief.tema.trim().length >= 3 &&
    (conf(brief, "tema") === "alta" ||
      transcript.includes(brief.tema.toLowerCase().slice(0, Math.min(12, brief.tema.length))));

  if (!mentionedYear || conf(brief, "anoSerie") === "baixa" || conf(brief, "etapa") === "baixa") {
    assumptions.push({
      field: "anoSerie",
      label: "Ano/série",
      value: `${brief.etapa} · ${brief.anoSerie}`,
      reason: "Não ficou claro no áudio; assumimos o mais comum para o tema.",
    });
    pendingQuestions.push({
      id: "anoSerie",
      question: `Para qual ano escolar você precisa? (agora: ${brief.anoSerie})`,
    });
  }

  if (
    (brief.tipoMaterial === "lista" || brief.tipoMaterial === "prova") &&
    !mentionedQty
  ) {
    assumptions.push({
      field: "quantidade",
      label: "Quantidade de questões",
      value: String(brief.quantidade),
      reason: "Quantidade não foi dita; usamos um padrão pedagógico equilibrado.",
    });
    pendingQuestions.push({
      id: "quantidade",
      question: `Quantas questões você quer? (agora: ${brief.quantidade})`,
    });
  }

  if (!mentionedTema || conf(brief, "tema") === "baixa") {
    if (brief.tema.trim()) {
      assumptions.push({
        field: "tema",
        label: "Tema",
        value: brief.tema,
        reason: "Tema inferido; confirme se está certo.",
      });
    }
    pendingQuestions.push({
      id: "tema",
      question: "Qual é o tema central do material?",
    });
  }

  return {
    assumptions,
    pendingQuestions: pendingQuestions.slice(0, 2),
  };
}

export const COPILOTO_PROGRESS_STAGES = {
  interpreting: [
    "Lendo o pedido do professor…",
    "Separando etapa, tema e inclusão…",
    "Consultando habilidades BNCC…",
    "Cruzando tendências ENEM/vestibular…",
    "Montando o brief pedagógico…",
  ],
  generating: [
    "Escolhendo o agente especializado…",
    "Formatando o material…",
    "Criando enunciados e gabarito…",
    "Aplicando adaptações de inclusão…",
    "Revisando qualidade pedagógica…",
  ],
  refining: [
    "Entendendo o ajuste pedido…",
    "Preservando o que já estava bom…",
    "Reescrevendo trechos solicitados…",
    "Rechecando gabarito e coerência…",
  ],
  transcribing: [
    "Ouvindo o áudio…",
    "Aplicando dicionário pedagógico…",
    "Corrigindo siglas (BNCC, PEI, TEA)…",
  ],
} as const;
