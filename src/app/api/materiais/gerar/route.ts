import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TipoMaterial =
  | "apostila"
  | "atividade"
  | "prova"
  | "slides"
  | "projeto"
  | "jogo"
  | "sequencia"
  | "resumo"
  | "lista"
  | "plano-aula"
  | "flashcards"
  | "redacao"
  | "mapa-mental";

type MaterialRequest = {
  tipoMaterial?: TipoMaterial;
  tipo?: TipoMaterial;
  etapa?: string;
  anoSerie?: string;
  componenteCurricular?: string;
  componente?: string;
  tema?: string;
  temaCentral?: string;
  objetivo?: string;
  objetivos?: string;
  quantidade?: string;
  dificuldade?: string;
  formatoJogo?: string | null;
  incluirGabarito?: boolean;
};

type GeminiPart = {
  text?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
  error?: {
    message?: string;
  };
};

const MODEL =
  process.env.GEMINI_MODEL ||
  process.env.GOOGLE_GEMINI_MODEL ||
  "gemini-2.5-flash";

function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ""
  );
}

function asText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function stripCodeFence(value: string) {
  return value
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fallbackTextToHtml(value: string) {
  const clean = stripCodeFence(value);

  if (/<[a-z][\s\S]*>/i.test(clean)) {
    return clean;
  }

  const lines = clean
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return "<p>Material gerado sem conteúdo textual.</p>";
  }

  return lines
    .map((line) => {
      if (/^#{1,3}\s+/.test(line)) {
        return `<h2>${escapeHtml(line.replace(/^#{1,3}\s+/, ""))}</h2>`;
      }

      return `<p>${escapeHtml(line)}</p>`;
    })
    .join("\n");
}

function getTipo(payload: MaterialRequest): TipoMaterial {
  return payload.tipoMaterial || payload.tipo || "apostila";
}

function tipoLabel(tipo: TipoMaterial) {
  const labels: Record<TipoMaterial, string> = {
    apostila: "apostila completa",
    atividade: "atividade pedagógica",
    prova: "prova avaliativa",
    slides: "apresentação de slides",
    projeto: "projeto pedagógico",
    jogo: "jogo pedagógico",
    sequencia: "sequência didática",
    resumo: "resumo guiado",
    lista: "lista de exercícios",
    "plano-aula": "plano de aula",
    flashcards: "flashcards",
    redacao: "correção orientada de redação",
    "mapa-mental": "mapa mental",
  };

  return labels[tipo] || "material didático";
}

function estruturaPorTipo(payload: MaterialRequest) {
  const tipo = getTipo(payload);
  const formatoJogo = asText(payload.formatoJogo, "caça-palavras");
  const incluirGabarito = payload.incluirGabarito !== false;

  const base =
    "Responda em HTML limpo, sem Markdown e sem bloco de código. Use h1, h2, h3, p, ul, ol, table quando fizer sentido. Não inclua CSS, scripts, links externos nem comentários técnicos.";

  const common =
    "Nunca misture formatos: se for apostila, não transforme em prova; se for jogo, não gere atividade comum; se for slides, não entregue texto corrido. O material precisa ter aparência pedagógica profissional, instruções claras e estrutura pronta para edição/impressão.";

  const gabarito = incluirGabarito
    ? "Inclua gabarito, respostas esperadas ou orientações de correção quando o formato permitir."
    : "Não inclua gabarito.";

  const byType: Record<TipoMaterial, string> = {
    apostila:
      "Estruture como apostila completa: capa textual, objetivos de aprendizagem, introdução, explicação principal, exemplos contextualizados, quadro de conceitos-chave, atividades de fixação, atividade final e gabarito quando solicitado.",
    atividade:
      "Estruture como atividade pedagógica: identificação, objetivo, tempo estimado, materiais necessários, contextualização, comandos para o aluno, etapas de desenvolvimento, critérios de avaliação e fechamento.",
    prova:
      "Estruture como prova avaliativa: cabeçalho, instruções ao estudante, questões objetivas, questões discursivas, distribuição equilibrada de dificuldade, pontuação sugerida e gabarito quando solicitado.",
    slides:
      "Estruture como roteiro de slides: cada slide deve ter título curto, tópicos essenciais, sugestão visual e fala breve do professor. Não escreva parágrafos longos nos slides.",
    projeto:
      "Estruture como projeto pedagógico: justificativa, objetivo geral, objetivos específicos, etapas, cronograma, produto final, recursos, avaliação, rubrica simples e possibilidades interdisciplinares.",
    jogo:
      `Estruture exclusivamente como jogo pedagógico do tipo ${formatoJogo}: objetivo do jogo, quantidade de participantes, materiais, regras, preparação, versão do aluno, conteúdo do jogo e gabarito/solução quando solicitado. Se for caça-palavras ou cruzadinha, gere lista de palavras, pistas e solução textual organizada.`,
    sequencia:
      "Estruture como sequência didática: objetivo geral, aulas/etapas numeradas, habilidades trabalhadas de forma descritiva, desenvolvimento, atividades, recursos, avaliação formativa e fechamento.",
    resumo:
      "Estruture como resumo guiado: explicação clara, tópicos essenciais, conceitos-chave, glossário, exemplos rápidos, perguntas de revisão e síntese final.",
    lista:
      "Estruture como lista de exercícios: cabeçalho, instruções, questões numeradas, variedade de formatos, níveis de dificuldade, espaço de resposta e gabarito quando solicitado.",
    "plano-aula":
      "Estruture como plano de aula: identificação, tema, objetivos, conhecimentos prévios, metodologia, desenvolvimento por etapas, recursos, avaliação, adaptação e fechamento.",
    flashcards:
      "Estruture como flashcards: tabela com frente e verso, pergunta objetiva, resposta curta, nível de dificuldade e sugestão de uso em sala.",
    redacao:
      "Estruture como correção orientada de redação: critérios, rubrica, pontos fortes, pontos de melhoria, orientações de reescrita e proposta de intervenção quando fizer sentido.",
    "mapa-mental":
      "Estruture como mapa mental textual: tema central, ramos principais, sub-ramos, conceitos-chave, conexões e versão resumida para copiar no quadro.",
  };

  return `${base}\n${common}\n${gabarito}\n${byType[tipo]}`;
}

function buildPrompt(payload: MaterialRequest) {
  const tipo = getTipo(payload);
  const tema = asText(payload.tema || payload.temaCentral);
  const etapa = asText(payload.etapa, "não informada");
  const anoSerie = asText(payload.anoSerie, "não informado");
  const componente = asText(
    payload.componenteCurricular || payload.componente,
    "não informado"
  );
  const objetivo = asText(payload.objetivo || payload.objetivos, "não informado");
  const quantidade = asText(payload.quantidade, "adequada ao formato");
  const dificuldade = asText(payload.dificuldade, "média");

  return `
Você é a IA pedagógica do Planify, uma plataforma profissional para professores brasileiros.

Tarefa: gerar ${tipoLabel(tipo)}.

Dados:
- Tema: ${tema}
- Etapa: ${etapa}
- Ano/Série: ${anoSerie}
- Componente curricular: ${componente}
- Objetivo/observação do professor: ${objetivo}
- Quantidade/extensão desejada: ${quantidade}
- Dificuldade: ${dificuldade}

Regras de qualidade:
${estruturaPorTipo(payload)}

Cuidados obrigatórios:
- Adeque linguagem e profundidade ao ano/série.
- Organize bem espaços, títulos e seções.
- Evite repetição.
- Não mencione Gemini, API, prompt, modelo de IA ou bastidores técnicos.
- Não invente dados sensíveis.
- Não use conteúdo protegido de terceiros.
- Entregue somente o HTML final do material.
`.trim();
}

async function callGemini(prompt: string) {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Chave da IA não encontrada no servidor. Configure GEMINI_API_KEY ou GOOGLE_GEMINI_API_KEY no ambiente.",
      },
      { status: 500 }
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.55,
        topP: 0.9,
        maxOutputTokens: 8192,
      },
    }),
  });

  const data = (await response.json().catch(() => null)) as GeminiResponse | null;

  if (!response.ok) {
    return NextResponse.json(
      {
        ok: false,
        message:
          data?.error?.message ||
          "A IA não conseguiu gerar o material neste momento.",
      },
      { status: response.status }
    );
  }

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("\n")
      .trim() || "";

  if (!text) {
    return NextResponse.json(
      {
        ok: false,
        message: "A IA respondeu sem conteúdo utilizável.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    html: fallbackTextToHtml(text),
    model: MODEL,
  });
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as MaterialRequest;
    const tema = asText(payload.tema || payload.temaCentral);

    if (!tema) {
      return NextResponse.json(
        {
          ok: false,
          message: "Informe o tema para gerar o material.",
        },
        { status: 400 }
      );
    }

    const prompt = buildPrompt(payload);
    return await callGemini(prompt);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro inesperado ao gerar material.";

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 }
    );
  }
}
