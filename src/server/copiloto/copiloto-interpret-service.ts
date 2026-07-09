import {
  DEFAULT_MATERIAL_EDUCATION,
  normalizeMaterialEducation,
} from "@/lib/educacao/education-options";
import {
  capCopilotoQuantity,
  detectCopilotoDynamicIntent,
  detectCopilotoReadingIntent,
  type CopilotoBrief,
  type CopilotoFieldConfidence,
  type CopilotoMaterialType,
} from "@/lib/copiloto/types";
import { generateGeminiJSON } from "@/server/ai/gemini-client";
import {
  buildCopilotoInterpretPrompt,
  COPILOTO_INTERPRET_RESPONSE_SCHEMA,
  COPILOTO_INTERPRET_SYSTEM_INSTRUCTION,
  COPILOTO_MATERIAL_TYPES,
} from "@/server/ai/prompts/copiloto-interpret-prompt";
import { buildCopilotoAlinhamento } from "@/server/copiloto/copiloto-alignment-service";

type RawInterpret = {
  tipoMaterial?: string;
  etapa?: string;
  anoSerie?: string;
  areaConhecimento?: string;
  componenteCurricular?: string;
  tema?: string;
  conteudo?: string;
  quantidade?: number;
  dificuldade?: string;
  inclusao?: {
    ativa?: boolean;
    necessidades?: string[];
    adaptacoesSugeridas?: string[];
    resumo?: string;
  };
  confianca?: Partial<
    Record<
      | "tipoMaterial"
      | "etapa"
      | "anoSerie"
      | "componenteCurricular"
      | "tema"
      | "inclusao",
      CopilotoFieldConfidence
    >
  >;
  resumoPedido?: string;
};

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeTipo(
  value: unknown,
  transcript: string,
): { tipo: CopilotoMaterialType; remapNotice: string | null } {
  const raw = asText(value).toLowerCase();
  const blob = `${raw} ${transcript}`.toLowerCase();
  const reading = detectCopilotoReadingIntent(transcript);
  const dynamic = detectCopilotoDynamicIntent(transcript);

  if (/cruzadinha|palavra.?cruzad|caca.?palavra|jogo|flashcard|mapa mental|apostila|sequencia|projeto|pei/.test(blob)) {
    return {
      tipo: "lista",
      remapNotice:
        "Esse formato não está no Copiloto. Vamos gerar uma lista de exercícios com qualidade máxima.",
    };
  }

  // Regra de ouro: interpretação/texto + questões → lista (nunca atividade)
  if (reading && !dynamic) {
    return { tipo: "lista", remapNotice: null };
  }

  if (raw.includes("prova") || raw.includes("avali") || /\bteste\b/.test(blob)) {
    return { tipo: "prova", remapNotice: null };
  }
  if (raw.includes("reda") || /disserta|enem/.test(blob)) {
    return { tipo: "redacao", remapNotice: null };
  }
  if (raw.includes("plano")) {
    return { tipo: "plano-aula", remapNotice: null };
  }
  if (
    (COPILOTO_MATERIAL_TYPES as readonly string[]).includes(raw) &&
    raw === "atividade"
  ) {
    if (reading) {
      return {
        tipo: "lista",
        remapNotice:
          "Pedido de interpretação com texto foi convertido para Lista de exercícios (melhor qualidade).",
      };
    }
    return { tipo: "atividade", remapNotice: null };
  }
  if (raw === "lista" || raw.includes("exerc") || raw.includes("fixa")) {
    return { tipo: "lista", remapNotice: null };
  }
  if (dynamic) {
    return { tipo: "atividade", remapNotice: null };
  }
  if ((COPILOTO_MATERIAL_TYPES as readonly string[]).includes(raw)) {
    return { tipo: raw as CopilotoMaterialType, remapNotice: null };
  }

  return { tipo: "lista", remapNotice: null };
}

function normalizeDificuldade(
  value: unknown,
): CopilotoBrief["dificuldade"] {
  const raw = asText(value).toLowerCase();
  if (raw === "facil" || raw === "fácil") return "facil";
  if (
    raw === "dificil" ||
    raw === "difícil" ||
    raw === "avancada" ||
    raw === "avançada"
  ) {
    return "avancada";
  }
  return "media";
}

export async function interpretCopilotoTranscript(
  transcript: string,
): Promise<CopilotoBrief> {
  const cleaned = transcript.trim();
  if (cleaned.length < 8) {
    throw new Error("Descreva o pedido com um pouco mais de detalhe.");
  }

  const raw = await generateGeminiJSON<RawInterpret>({
    systemInstruction: COPILOTO_INTERPRET_SYSTEM_INSTRUCTION,
    prompt: buildCopilotoInterpretPrompt(cleaned),
    responseSchema: COPILOTO_INTERPRET_RESPONSE_SCHEMA,
    temperature: 0.2,
    maxOutputTokens: 4096,
    timeoutMs: 60_000,
    tier: "default",
  });

  const { tipo, remapNotice } = normalizeTipo(raw.tipoMaterial, cleaned);

  const education = normalizeMaterialEducation(DEFAULT_MATERIAL_EDUCATION, {
    etapa: asText(raw.etapa) || DEFAULT_MATERIAL_EDUCATION.etapa,
    anoSerie: asText(raw.anoSerie) || DEFAULT_MATERIAL_EDUCATION.anoSerie,
    areaConhecimento:
      asText(raw.areaConhecimento) || DEFAULT_MATERIAL_EDUCATION.areaConhecimento,
    componente:
      asText(raw.componenteCurricular) || DEFAULT_MATERIAL_EDUCATION.componente,
  });

  const tema = asText(raw.tema) || cleaned.slice(0, 80);
  const conteudo = asText(raw.conteudo) || cleaned;
  const inclusaoAtiva = Boolean(raw.inclusao?.ativa);
  const necessidades = asStringList(raw.inclusao?.necessidades);
  const adaptacoes = asStringList(raw.inclusao?.adaptacoesSugeridas);

  const alignmentResult = await buildCopilotoAlinhamento({
    etapa: education.etapa,
    anoSerie: education.anoSerie,
    areaConhecimento: education.areaConhecimento,
    componenteCurricular: education.componente,
    tema,
    conteudo,
  });
  const { aviso: alinhamentoAviso, ...alinhamento } = alignmentResult;

  const quantidade = capCopilotoQuantity(
    tipo,
    typeof raw.quantidade === "number" ? raw.quantidade : 0,
  );

  return {
    transcript: cleaned,
    tipoMaterial: tipo,
    etapa: education.etapa,
    anoSerie: education.anoSerie,
    areaConhecimento: education.areaConhecimento,
    componenteCurricular: education.componente,
    tema,
    conteudo,
    quantidade,
    dificuldade: normalizeDificuldade(raw.dificuldade),
    inclusao: {
      ativa: inclusaoAtiva || necessidades.length > 0,
      necessidades,
      adaptacoesSugeridas: adaptacoes,
      resumo:
        asText(raw.inclusao?.resumo) ||
        (inclusaoAtiva || necessidades.length > 0
          ? `Incluir adaptações para: ${necessidades.join(", ") || "necessidades especiais"}.`
          : "Sem necessidade de inclusão detectada."),
    },
    alinhamento,
    confianca: raw.confianca || {},
    resumoPedido: asText(raw.resumoPedido) || tema,
    remapNotice,
    alinhamentoAviso: alinhamentoAviso || null,
  };
}
