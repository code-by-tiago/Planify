import { EDITOR_COMPLEMENTARY_ADJUST_MARKER } from "@/lib/ai/material-generation-policy";
import {
  type CopilotoApiErrorBody,
  isCopilotoApiFailure,
  throwCopilotoApiError,
} from "@/lib/copiloto/copiloto-api-contract";
import {
  COPILOTO_SOURCE,
  createCopilotoIdempotencyKey,
} from "@/lib/copiloto/copiloto-utils";
import {
  COPILOTO_TEXTO_FONTE_MARKER,
  capCopilotoQuantity,
  detectCopilotoReadingIntent,
  type CopilotoBrief,
  type CopilotoMaterialType,
} from "@/lib/copiloto/types";
import { correctPedagogicalTranscript } from "@/lib/copiloto/pedagogical-glossary";
import type { MaterialEngineInput } from "@/server/materials/material-engine-types";

export type { CopilotoBrief };
export { correctPedagogicalTranscript };

const TRANSCRIBE_TIMEOUT_MS = 65_000;
const INTERPRET_TIMEOUT_MS = 115_000;

export async function requestCopilotoTranscription(
  audioBlob: Blob,
  options?: { signal?: AbortSignal },
): Promise<string> {
  const form = new FormData();
  const ext =
    audioBlob.type.includes("mp4") || audioBlob.type.includes("m4a")
      ? "m4a"
      : audioBlob.type.includes("wav")
        ? "wav"
        : "webm";
  form.append("audio", audioBlob, `copiloto.${ext}`);

  let response: Response;
  try {
    response = await fetch("/api/copiloto/transcrever", {
      method: "POST",
      credentials: "include",
      body: form,
      signal: options?.signal ?? AbortSignal.timeout(TRANSCRIBE_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throwCopilotoApiError(
        new Response(null, { status: 504 }),
        { message: "A transcrição demorou demais. Tente gravar de novo ou digite o pedido." },
        "A transcrição demorou demais. Tente gravar de novo ou digite o pedido.",
      );
    }
    throw error;
  }

  const data = (await response.json().catch(() => null)) as
    | (CopilotoApiErrorBody & { transcript?: string })
    | null;

  if (isCopilotoApiFailure(response, data) || !data?.transcript) {
    throwCopilotoApiError(
      response,
      data,
      "Não foi possível transcrever o áudio.",
    );
  }

  return correctPedagogicalTranscript(data.transcript);
}

export async function requestCopilotoInterpretation(
  transcript: string,
  options?: { signal?: AbortSignal },
): Promise<CopilotoBrief> {
  let response: Response;
  try {
    response = await fetch("/api/copiloto/interpretar", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: correctPedagogicalTranscript(transcript),
      }),
      signal: options?.signal ?? AbortSignal.timeout(INTERPRET_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throwCopilotoApiError(
        new Response(null, { status: 504 }),
        { message: "A interpretação demorou demais. Tente novamente com um pedido mais curto." },
        "A interpretação demorou demais. Tente novamente com um pedido mais curto.",
      );
    }
    throw error;
  }

  const data = (await response.json().catch(() => null)) as
    | (CopilotoApiErrorBody & { brief?: CopilotoBrief })
    | null;

  if (isCopilotoApiFailure(response, data) || !data?.brief) {
    throwCopilotoApiError(
      response,
      data,
      "Não foi possível interpretar o pedido.",
    );
  }

  return data.brief;
}

function typeSpecificBlock(brief: CopilotoBrief): string {
  const tipo = brief.tipoMaterial;
  const reading = detectCopilotoReadingIntent(
    `${brief.transcript}\n${brief.conteudo}\n${brief.tema}`,
  );

  if (tipo === "lista" || tipo === "prova") {
    const wantsReading = reading;
    return [
      wantsReading ? COPILOTO_TEXTO_FONTE_MARKER : "",
      wantsReading
        ? [
            "TEXTO-FONTE OBRIGATÓRIO:",
            "1) Inclua seção 'Texto para leitura' com texto completo utilizável em sala.",
            "2) Se a obra pedida for protegida, use trecho pedagógico inspirado no estilo / domínio público — não finja ser a obra integral.",
            "3) Todas as questões devem ancorar-se nesse texto.",
            "4) Alternativas distintas; proibido placeholder genérico.",
          ].join("\n")
        : "Gere questões objetivas/discursivas robustas com gabarito. Sem introdução longa.",
      `Quantidade exata de questões: ${brief.quantidade}.`,
      "Incluir gabarito completo.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (tipo === "redacao") {
    return [
      `Gere proposta de redação com exatamente ${brief.quantidade} textos motivadores.`,
      "Inclua seção 'Tema e comando' (tema, gênero, público, finalidade, comando).",
      "Inclua rubrica em teacherNotes: tema, argumentação, coesão, linguagem e repertório.",
      "Não gere seção de questões de múltipla escolha.",
    ].join("\n");
  }

  if (tipo === "plano-aula") {
    return [
      `Planeje ${brief.quantidade} período(s) de 50 minutos.`,
      "Inclua tabela cronometrada, lessonPlan.steps (5+ etapas) e atividade em sala aplicável.",
      "Ações concretas do professor e dos estudantes — zero genérico.",
    ].join("\n");
  }

  return [
    "Gere DINÂMICA / PRÁTICA DE SALA (não lista/prova).",
    "Inclua estímulo ou texto-fonte concreto (mín. 80 palavras aplicáveis) quando o tema exigir contexto.",
    "Estrutura obrigatória: Objetivo, Tempo total, Materiais, Desenvolvimento (passos numerados), Itens a)–e) específicos ao tema, Critérios de avaliação observável.",
    "Objetivo, tempo, materiais, desenvolvimento passo a passo, itens a)–e) específicos ao tema e avaliação observável.",
    "PROIBIDO: 'Complete a tarefa orientada pelo professor', itens idênticos ou placeholders genéricos.",
    `Quantidade de dinâmicas: ${brief.quantidade}.`,
  ].join("\n");
}

export function buildCopilotoGenerationPayload(
  brief: CopilotoBrief,
  idempotencyKey = createCopilotoIdempotencyKey(),
): MaterialEngineInput {
  const tipo = brief.tipoMaterial as CopilotoMaterialType;
  const quantidade = capCopilotoQuantity(tipo, brief.quantidade);

  const inclusaoBlock = brief.inclusao.ativa
    ? [
        "",
        "INCLUSÃO / ADAPTAÇÕES OBRIGATÓRIAS:",
        brief.inclusao.resumo,
        brief.inclusao.necessidades.length
          ? `Necessidades: ${brief.inclusao.necessidades.join("; ")}.`
          : "",
        brief.inclusao.adaptacoesSugeridas.length
          ? `Adaptações: ${brief.inclusao.adaptacoesSugeridas.join("; ")}.`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const alinhamentoBlock = [
    "",
    "ALINHAMENTO DINÂMICO (orientação pedagógica; não inventar códigos BNCC):",
    brief.alinhamento.resumo,
    brief.alinhamento.tendencias.length
      ? `Ênfases preditivas: ${brief.alinhamento.tendencias
          .map((t) => `${t.topico} (${t.fonte}, ${t.evidencias} evidências)`)
          .join("; ")}.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const typeBlock = typeSpecificBlock({ ...brief, quantidade });

  const conteudo = [
    brief.conteudo.trim(),
    "",
    typeBlock,
    inclusaoBlock,
    alinhamentoBlock,
  ]
    .filter(Boolean)
    .join("\n");

  const incluirGabarito =
    tipo === "lista" || tipo === "prova" || tipo === "redacao";

  return {
    tipoMaterial: tipo,
    tipo,
    etapa: brief.etapa,
    anoSerie: brief.anoSerie,
    areaConhecimento: brief.areaConhecimento,
    componenteCurricular: brief.componenteCurricular,
    componente: brief.componenteCurricular,
    tema: brief.tema,
    temaCentral: brief.tema,
    conteudo,
    quantidade,
    dificuldade: brief.dificuldade,
    incluirGabarito,
    generationSource: COPILOTO_SOURCE,
    observacoes: [
      brief.inclusao.ativa ? brief.inclusao.resumo : "",
      typeBlock.includes(COPILOTO_TEXTO_FONTE_MARKER)
        ? COPILOTO_TEXTO_FONTE_MARKER
        : "",
    ]
      .filter(Boolean)
      .join("\n") || undefined,
    habilidadesSelecionadas: brief.alinhamento.habilidades.map((h) => ({
      codigo: h.codigo,
      descricao: h.descricao,
      conteudo: brief.tema,
    })),
    idempotencyKey,
  };
}

/** Refina o material já gerado com instrução falada/digitada (memória de contexto). */
export function buildCopilotoRefinePayload(
  base: MaterialEngineInput,
  instruction: string,
  previousTitle: string,
): MaterialEngineInput {
  const trimmed = instruction.trim();
  const adjustBlock = [
    `${EDITOR_COMPLEMENTARY_ADJUST_MARKER} (aplicar sobre o material já gerado "${previousTitle}"; preserve o que não foi pedido para mudar):`,
    trimmed,
    "Não gere um material totalmente novo do zero — refine o existente.",
  ].join("\n");

  return {
    ...base,
    elevarQualidade: true,
    generationSource: base.generationSource || COPILOTO_SOURCE,
    problemasQualidade: [
      `Ajuste solicitado pelo professor via Copiloto: ${trimmed}`,
    ],
    observacoes: [base.observacoes?.trim(), adjustBlock]
      .filter(Boolean)
      .join("\n\n"),
    idempotencyKey: createCopilotoIdempotencyKey(),
  };
}
