import { appendPedagogicalGuardrails } from "@/lib/materiais/pedagogical-guardrails";
import {
  getPeiCidOption,
  getPeiDisciplineOption,
  type PeiGenerationRequest,
  type PeiGenerationResult,
  type PeiTrimestre,
} from "@/lib/pei/pei-options";
import { generateGeminiJSON } from "@/server/ai/gemini-client";

type PeiCurricularRow = {
  conteudo: string;
  habilidade: string;
  objetivo: string;
  adaptacao: string;
};

type PeiPlanningRow = {
  periodo: string;
  metodologia: string;
  recursos: string;
  avaliacao: string;
};

type PeiStructuredOutput = {
  perfil: string;
  suportes: string[];
  acessibilidade: string[];
  objetivos: string[];
  curricularRows: PeiCurricularRow[];
  planejamento: PeiPlanningRow[];
  articulacao: string[];
  parecer: string;
};

type PeiAiOutput = Partial<PeiStructuredOutput>;

export type PeiEngineResult =
  | { ok: false; status: number; message: string }
  | (PeiGenerationResult & {
      usedAI: boolean;
      estrutura: PeiStructuredOutput;
    });

const SYSTEM_INSTRUCTION = appendPedagogicalGuardrails(`Voce e um especialista brasileiro em educacao inclusiva, AEE e elaboracao de Plano Educacional Individualizado (PEI).
Produza conteudo pedagogico, colaborativo e institucional para o professor regente e o professor do Atendimento Educacional Especializado.
O CID ou perfil informado e referencia fornecida pela escola/professor; nao diagnostique, nao prescreva tratamento e nao substitua laudo ou avaliacao multiprofissional.
O PEI deve promover desenvolvimento integral, autonomia, acessibilidade curricular ou enriquecimento para Altas Habilidades/Superdotacao.
Retorne SOMENTE JSON valido, sem markdown, sem HTML, com linguagem profissional e objetiva.`);

const PERIODS_BY_TRIMESTER: Record<PeiTrimestre, string[]> = {
  "1": ["Fevereiro", "Marco", "Abril"],
  "2": ["Maio", "Junho", "Julho"],
  "3": ["Agosto", "Setembro", "Outubro/Novembro"],
  todos: ["1º trimestre", "2º trimestre", "3º trimestre"],
};

function cleanText(value: unknown, maxLength = 900): string {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

function uniqueClean(values: unknown, fallback: string[] = []): string[] {
  const source = Array.isArray(values) ? values : fallback;
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of source) {
    const text = cleanText(item, 320);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }

  return result;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDateInput(value: string | undefined): string {
  const trimmed = cleanText(value, 20);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return trimmed || "A preencher";
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function trimestreLabel(trimestre: PeiTrimestre): string {
  if (trimestre === "todos") return "Todos os trimestres";
  return `${trimestre}º trimestre`;
}

function normalizeRequest(payload: PeiGenerationRequest): PeiGenerationRequest {
  const disciplina = cleanText(payload.disciplina || "Lingua Portuguesa", 120);
  const discipline = getPeiDisciplineOption(disciplina);
  const conteudos = uniqueClean(payload.conteudos, discipline.conteudos).slice(0, 8);
  const habilidades = uniqueClean(
    payload.habilidades,
    discipline.habilidades.map((item) => item.label),
  ).slice(0, 8);

  return {
    ...payload,
    etapa: cleanText(payload.etapa || "Ensino Medio", 80),
    anoSerie: cleanText(payload.anoSerie, 80),
    disciplina,
    areaConhecimento:
      cleanText(payload.areaConhecimento, 120) || discipline.area,
    cid: cleanText(payload.cid, 40),
    conteudos,
    habilidades,
    trimestre: payload.trimestre || "todos",
  };
}

export function validatePeiPayload(payload: PeiGenerationRequest): string | null {
  if (!payload || typeof payload !== "object") {
    return "Requisicao invalida.";
  }

  if (!cleanText(payload.cid)) {
    return "Selecione o CID ou perfil educacional do estudante.";
  }

  if (!cleanText(payload.disciplina)) {
    return "Selecione a disciplina/componente curricular.";
  }

  if (!cleanText(payload.anoSerie)) {
    return "Informe o ano ou serie do estudante.";
  }

  if (!Array.isArray(payload.conteudos) || payload.conteudos.length === 0) {
    return "Selecione ao menos um conteudo curricular.";
  }

  if (!Array.isArray(payload.habilidades) || payload.habilidades.length === 0) {
    return "Selecione ao menos uma habilidade.";
  }

  return null;
}

function buildFallbackOutput(payload: PeiGenerationRequest): PeiStructuredOutput {
  const cid = getPeiCidOption(payload.cid);
  const isEnrichment = cid.codigo === "AHSD";
  const periods = PERIODS_BY_TRIMESTER[payload.trimestre] ?? PERIODS_BY_TRIMESTER.todos;
  const needs = cleanText(payload.necessidades, 600);
  const strengths = cleanText(payload.potencialidades, 600);
  const barriers = cleanText(payload.barreiras, 600);
  const resources = cleanText(payload.recursos, 500);

  const perfilParts = [
    `Estudante acompanhado em PEI para garantir acesso ao curriculo de ${payload.disciplina}, considerando ${cid.label}.`,
    strengths
      ? `Potencialidades observadas: ${strengths}.`
      : "O planejamento deve partir das habilidades ja demonstradas, do interesse do estudante e de evidencias coletadas em sala e na Sala de Recursos Multifuncionais.",
    needs ? `Necessidades educacionais registradas: ${needs}.` : "",
    barriers ? `Barreiras identificadas: ${barriers}.` : "",
  ].filter(Boolean);

  const supportBase = [
    ...cid.suportes,
    "Mediacao pedagogica pelo professor regente articulada ao AEE",
    "Fragmentacao de comandos, exemplos modelados e checagem de compreensao",
    "Registro continuo de avancos, barreiras e ajustes necessarios",
  ];

  const acessibilidade = isEnrichment
    ? [
        "Enriquecimento curricular por investigacao, projetos autorais e aprofundamento conceitual.",
        "Flexibilizacao de produto final, permitindo pesquisa, prototipo, apresentacao ou curadoria.",
        "Metas de autonomia, autoria, colaboracao e socializacao de descobertas.",
        "Articulacao com AEE/equipe escolar para acompanhamento socioemocional e desafios adequados.",
      ]
    : [
        "Priorizacao dos objetivos essenciais sem retirar o estudante do curriculo comum.",
        "Adequacao de linguagem, tempo, recursos e forma de resposta conforme barreiras observadas.",
        "Uso de apoio visual, material concreto/digital, modelos e pistas graduadas.",
        "Avaliacao formativa, processual e multimodal, com criterios flexibilizados quando necessario.",
      ];

  const curricularRows = payload.conteudos.map((conteudo, index) => {
    const habilidade = payload.habilidades[index % payload.habilidades.length];
    return {
      conteudo,
      habilidade,
      objetivo: isEnrichment
        ? `Aprofundar ${conteudo.toLowerCase()} por investigacao orientada, relacionando a habilidade selecionada a um produto autoral.`
        : `Acessar ${conteudo.toLowerCase()} por meio de objetivos essenciais, com apoio para compreender, praticar e demonstrar a habilidade selecionada.`,
      adaptacao: isEnrichment
        ? "Propor desafio ampliado, pesquisa guiada, fontes diversificadas e socializacao do produto."
        : "Oferecer comandos curtos, exemplo resolvido, recurso visual/concreto, tempo ampliado e resposta oral, escrita, digital ou por esquema.",
    };
  });

  const planejamento = periods.map((periodo, index) => ({
    periodo,
    metodologia:
      index === 0
        ? "Acolhimento, sondagem pedagogica funcional, ensino estruturado, modelagem e combinados de rotina."
        : index === 1
          ? "Praticas guiadas em pequenos passos, mediacao por pares, pistas graduadas e retomadas frequentes."
          : "Aplicacao em situacoes contextualizadas, generalizacao das aprendizagens e autonomia progressiva.",
    recursos:
      resources ||
      "Slides ou cartazes visuais, atividades impressas adaptadas, organizadores graficos, tecnologia assistiva quando disponivel e jogos pedagogicos.",
    avaliacao:
      "Avaliacao formativa e processual por observacao, producoes, registro de participacao, autoavaliacao mediada e criterios individualizados.",
  }));

  const student = cleanText(payload.estudanteNome, 120) || "o estudante";
  const parecer = [
    `No periodo planejado, ${student} devera ser acompanhado por PEI elaborado de forma colaborativa entre professor regente, AEE e equipe escolar.`,
    isEnrichment
      ? `As acoes propostas priorizam enriquecimento curricular, aprofundamento, autoria e ampliacao de desafios em ${payload.disciplina}.`
      : `As acoes propostas priorizam acessibilidade curricular, participacao nas atividades comuns e desenvolvimento gradual de autonomia em ${payload.disciplina}.`,
    `Recomenda-se manter registros sistematicos de progresso, ajustar recursos conforme as evidencias e garantir que as avaliacoes considerem as estrategias previstas neste plano.`,
  ].join(" ");

  return {
    perfil: perfilParts.join(" "),
    suportes: uniqueClean(supportBase).slice(0, 8),
    acessibilidade,
    objetivos: payload.habilidades.slice(0, 5).map((habilidade) =>
      isEnrichment
        ? `Ampliar a habilidade "${habilidade}" por meio de investigacao, autoria e socializacao.`
        : `Desenvolver a habilidade "${habilidade}" com mediacao, recursos acessiveis e progressao por etapas.`,
    ),
    curricularRows,
    planejamento,
    articulacao: [
      "Professor regente e AEE devem revisar o plano periodicamente, analisando evidencias de participacao, aprendizagem e autonomia.",
      "A Sala de Recursos Multifuncionais deve apoiar recursos, estrategias, comunicacao acessivel e acompanhamento das barreiras.",
      "Equipe pedagogica, familia e demais profissionais devem ser envolvidos quando suas informacoes contribuirem para o acesso ao curriculo.",
    ],
    parecer,
  };
}

function buildPrompt(payload: PeiGenerationRequest): string {
  const cid = getPeiCidOption(payload.cid);
  const discipline = getPeiDisciplineOption(payload.disciplina);
  return [
    "Gere os campos de um PEI com base nestes dados.",
    "Use linguagem institucional, concreta, revisavel pelo professor e adequada ao Brasil.",
    "Nao invente laudos, historico clinico, BNCC codificada nem informacoes nao fornecidas.",
    "Inclua acessibilidade curricular ou enriquecimento quando o perfil for AH/SD.",
    "O parecer deve ter 1 a 3 paragrafos, foco pedagogico e indicar acompanhamento colaborativo.",
    "",
    JSON.stringify(
      {
        estudante: {
          nome: payload.estudanteNome || "",
          etapa: payload.etapa,
          anoSerie: payload.anoSerie,
          turma: payload.turma || payload.className || "",
          turno: payload.turno || "",
        },
        professores: {
          regente: payload.professorRegente || "",
          aee: payload.professorAee || "",
        },
        curriculo: {
          areaConhecimento: payload.areaConhecimento || discipline.area,
          disciplina: payload.disciplina,
          conteudos: payload.conteudos,
          habilidades: payload.habilidades,
          trimestre: payload.trimestre,
        },
        referencia: {
          cid: cid.codigo,
          label: cid.label,
          categoria: cid.categoria,
          suportesSugeridos: cid.suportes,
        },
        contextoPedagogico: {
          necessidades: payload.necessidades || "",
          potencialidades: payload.potencialidades || "",
          barreiras: payload.barreiras || "",
          recursosDisponiveis: payload.recursos || "",
          observacoes: payload.observacoes || "",
        },
      },
      null,
      2,
    ),
    "",
    "Retorne JSON com exatamente estas chaves: perfil (string), suportes (string[]), acessibilidade (string[]), objetivos (string[]), curricularRows (array de {conteudo, habilidade, objetivo, adaptacao}), planejamento (array de {periodo, metodologia, recursos, avaliacao}), articulacao (string[]), parecer (string).",
  ].join("\n");
}

function normalizeAiOutput(
  raw: PeiAiOutput,
  fallback: PeiStructuredOutput,
): PeiStructuredOutput {
  const curricularRows = Array.isArray(raw.curricularRows)
    ? raw.curricularRows
        .map((row, index) => ({
          conteudo:
            cleanText(row?.conteudo, 220) ||
            fallback.curricularRows[index % fallback.curricularRows.length]?.conteudo ||
            "",
          habilidade:
            cleanText(row?.habilidade, 320) ||
            fallback.curricularRows[index % fallback.curricularRows.length]?.habilidade ||
            "",
          objetivo:
            cleanText(row?.objetivo, 500) ||
            fallback.curricularRows[index % fallback.curricularRows.length]?.objetivo ||
            "",
          adaptacao:
            cleanText(row?.adaptacao, 500) ||
            fallback.curricularRows[index % fallback.curricularRows.length]?.adaptacao ||
            "",
        }))
        .filter((row) => row.conteudo && row.habilidade)
    : [];

  const planejamento = Array.isArray(raw.planejamento)
    ? raw.planejamento
        .map((row, index) => ({
          periodo:
            cleanText(row?.periodo, 120) ||
            fallback.planejamento[index % fallback.planejamento.length]?.periodo ||
            "",
          metodologia:
            cleanText(row?.metodologia, 600) ||
            fallback.planejamento[index % fallback.planejamento.length]?.metodologia ||
            "",
          recursos:
            cleanText(row?.recursos, 500) ||
            fallback.planejamento[index % fallback.planejamento.length]?.recursos ||
            "",
          avaliacao:
            cleanText(row?.avaliacao, 500) ||
            fallback.planejamento[index % fallback.planejamento.length]?.avaliacao ||
            "",
        }))
        .filter((row) => row.periodo && row.metodologia)
    : [];

  return {
    perfil: cleanText(raw.perfil, 1200) || fallback.perfil,
    suportes: uniqueClean(raw.suportes, fallback.suportes).slice(0, 10),
    acessibilidade: uniqueClean(raw.acessibilidade, fallback.acessibilidade).slice(0, 10),
    objetivos: uniqueClean(raw.objetivos, fallback.objetivos).slice(0, 8),
    curricularRows:
      curricularRows.length >= 2 ? curricularRows.slice(0, 8) : fallback.curricularRows,
    planejamento:
      planejamento.length >= 2 ? planejamento.slice(0, 6) : fallback.planejamento,
    articulacao: uniqueClean(raw.articulacao, fallback.articulacao).slice(0, 6),
    parecer: cleanText(raw.parecer, 1600) || fallback.parecer,
  };
}

function listHtml(items: string[]): string {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function tableRows(rows: Array<[string, string]>): string {
  return rows
    .map(
      ([label, value]) =>
        `<tr><th scope="row">${escapeHtml(label)}</th><td>${escapeHtml(value || "A preencher")}</td></tr>`,
    )
    .join("");
}

function renderPeiHtml(
  payload: PeiGenerationRequest,
  output: PeiStructuredOutput,
): string {
  const cid = getPeiCidOption(payload.cid);
  const title = buildPeiTitle(payload);
  const turma = cleanText(payload.turma || payload.className, 120);
  const periodo = cleanText(payload.periodoRealizacao, 120) || trimestreLabel(payload.trimestre);

  const curricularRows = output.curricularRows
    .map(
      (row) => `<tr>
        <td>${escapeHtml(row.conteudo)}</td>
        <td>${escapeHtml(row.habilidade)}</td>
        <td>${escapeHtml(row.objetivo)}</td>
        <td>${escapeHtml(row.adaptacao)}</td>
      </tr>`,
    )
    .join("");

  const planningRows = output.planejamento
    .map(
      (row) => `<tr>
        <td>${escapeHtml(row.periodo)}</td>
        <td>${escapeHtml(row.metodologia)}</td>
        <td>${escapeHtml(row.recursos)}</td>
        <td>${escapeHtml(row.avaliacao)}</td>
      </tr>`,
    )
    .join("");

  return `
<article class="planify-doc planify-pei-doc">
  <style>
    .planify-pei-doc{color:#0f172a;font-family:Arial,Helvetica,sans-serif;line-height:1.55}
    .planify-pei-doc h1{font-size:1.7rem;margin:0 0 .35rem;font-weight:800}
    .planify-pei-doc h2{font-size:1.02rem;margin:1.35rem 0 .55rem;font-weight:800;color:#0f766e}
    .planify-pei-doc h3{font-size:.92rem;margin:1rem 0 .45rem;font-weight:800}
    .planify-pei-doc .pei-eyebrow{font-size:.72rem;text-transform:uppercase;letter-spacing:.12em;font-weight:800;color:#0891b2}
    .planify-pei-doc .pei-note{border-left:4px solid #06b6d4;background:#ecfeff;padding:.85rem 1rem;border-radius:.5rem;margin:1rem 0}
    .planify-pei-doc table{width:100%;border-collapse:collapse;margin:.65rem 0 1rem;font-size:.88rem}
    .planify-pei-doc th,.planify-pei-doc td{border:1px solid #cbd5e1;padding:.55rem .65rem;vertical-align:top}
    .planify-pei-doc th{background:#f0fdfa;text-align:left;font-weight:800}
    .planify-pei-doc ul{margin:.35rem 0 .8rem;padding-left:1.15rem}
    .planify-pei-doc li{margin:.22rem 0}
    .planify-pei-doc .pei-signatures{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;margin-top:1.5rem}
    .planify-pei-doc .pei-signature{border-top:1px solid #94a3b8;padding-top:.4rem;text-align:center;font-size:.82rem}
  </style>

  <header>
    <p class="pei-eyebrow">Plano Educacional Individualizado</p>
    <h1>${escapeHtml(title)}</h1>
    <p><strong>Finalidade:</strong> assegurar acesso ao curriculo, desenvolvimento integral, participacao e autonomia do estudante por meio de medidas individualizadas e colaborativas.</p>
  </header>

  <section class="pei-note">
    <strong>Observacao institucional:</strong> O PEI e documento obrigatorio e deve ser elaborado de forma colaborativa pelo professor regente da classe regular, em conjunto com o professor do Atendimento Educacional Especializado, considerando especificidades do estudante, acessibilidade curricular ou enriquecimento para Altas Habilidades/Superdotacao, atividades da Sala de Recursos Multifuncionais e articulacao com os profissionais da escola.
  </section>

  <section>
    <h2>1. Identificacao do estudante</h2>
    <table>
      <tbody>
        ${tableRows([
          ["Nome", cleanText(payload.estudanteNome, 120)],
          ["Data de nascimento", formatDateInput(payload.dataNascimento)],
          ["Etapa", payload.etapa],
          ["Ano/Serie", payload.anoSerie],
          ["Turma", turma],
          ["Turno", cleanText(payload.turno, 80)],
          ["Periodo de realizacao", periodo],
          ["Professor(a) regente", cleanText(payload.professorRegente, 120)],
          ["Professor(a) do AEE/SRM", cleanText(payload.professorAee, 120)],
        ])}
      </tbody>
    </table>
  </section>

  <section>
    <h2>2. Referencia pedagogica e perfil funcional</h2>
    <table>
      <tbody>
        ${tableRows([
          ["CID/perfil informado", cid.label],
          ["Categoria", cid.categoria],
          ["Area do conhecimento", cleanText(payload.areaConhecimento, 120)],
          ["Componente curricular", payload.disciplina],
        ])}
      </tbody>
    </table>
    <p>${escapeHtml(output.perfil)}</p>
    <p><strong>Nota:</strong> o CID/perfil selecionado e uma referencia informada pelo professor/escola para orientar acessibilidade pedagogica. O Planify nao realiza diagnostico.</p>
  </section>

  <section>
    <h2>3. Tipo(s) de suporte(s) para a realizacao das atividades</h2>
    ${listHtml(output.suportes)}
  </section>

  <section>
    <h2>4. Plano de acessibilidade curricular ou enriquecimento</h2>
    ${listHtml(output.acessibilidade)}
    <h3>Objetivos individualizados</h3>
    ${listHtml(output.objetivos)}
  </section>

  <section>
    <h2>5. Conteudos, habilidades e estrategias</h2>
    <table>
      <thead>
        <tr>
          <th>Unidades tematicas / Conteudos</th>
          <th>Habilidades</th>
          <th>Objetivos individualizados</th>
          <th>Estrategias e adaptacoes</th>
        </tr>
      </thead>
      <tbody>${curricularRows}</tbody>
    </table>
  </section>

  <section>
    <h2>6. Planejamento das acoes</h2>
    <table>
      <thead>
        <tr>
          <th>Data / periodo</th>
          <th>Metodologias</th>
          <th>Recursos utilizados</th>
          <th>Avaliacao</th>
        </tr>
      </thead>
      <tbody>${planningRows}</tbody>
    </table>
  </section>

  <section>
    <h2>7. Articulacao entre professor regente, AEE e equipe escolar</h2>
    ${listHtml(output.articulacao)}
  </section>

  <section>
    <h2>8. Parecer pedagogico individualizado</h2>
    <p>${escapeHtml(output.parecer)}</p>
  </section>

  <section>
    <h2>9. Revisao e acompanhamento</h2>
    <p>Este PEI deve ser revisado durante o periodo letivo a partir de evidencias de aprendizagem, autonomia, participacao, barreiras observadas e estrategias que demonstraram efetividade.</p>
    <div class="pei-signatures">
      <div class="pei-signature">Professor(a) regente</div>
      <div class="pei-signature">Professor(a) do AEE/SRM</div>
    </div>
  </section>
</article>`.trim();
}

function buildPeiTitle(payload: PeiGenerationRequest): string {
  const student = cleanText(payload.estudanteNome, 80);
  const suffix = student ? ` - ${student}` : "";
  return `PEI - ${payload.disciplina}${suffix}`;
}

function assessQuality(output: PeiStructuredOutput, usedAI: boolean): number {
  let score = usedAI ? 88 : 82;
  if (output.curricularRows.length >= 3) score += 3;
  if (output.planejamento.length >= 3) score += 3;
  if (output.suportes.length >= 5) score += 2;
  if (output.acessibilidade.length >= 4) score += 2;
  if (output.parecer.length >= 280) score += 2;
  return Math.min(98, score);
}

function canUseGemini(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export async function generatePeiDocument(
  input: PeiGenerationRequest,
): Promise<PeiEngineResult> {
  const normalized = normalizeRequest(input);
  const validationError = validatePeiPayload(normalized);
  if (validationError) {
    return { ok: false, status: 400, message: validationError };
  }

  const fallback = buildFallbackOutput(normalized);

  if (!canUseGemini()) {
    const html = renderPeiHtml(normalized, fallback);
    return {
      ok: true,
      html,
      parecer: fallback.parecer,
      title: buildPeiTitle(normalized),
      pipeline: "pei-fallback",
      qualityScore: assessQuality(fallback, false),
      alertas: [
        "PEI estruturado pelo motor seguro do Planify. Revise colaborativamente com professor regente, AEE e equipe escolar.",
      ],
      usedAI: false,
      estrutura: fallback,
    };
  }

  try {
    const generated = await generateGeminiJSON<PeiAiOutput>({
      systemInstruction: SYSTEM_INSTRUCTION,
      prompt: buildPrompt(normalized),
      tier: "advanced",
      temperature: 0.35,
      maxOutputTokens: 8192,
    });

    const output = normalizeAiOutput(generated, fallback);
    const html = renderPeiHtml(normalized, output);

    return {
      ok: true,
      html,
      parecer: output.parecer,
      title: buildPeiTitle(normalized),
      pipeline: "pei-ai",
      qualityScore: assessQuality(output, true),
      alertas: [
        "Revise o PEI com os profissionais responsaveis antes de anexar ao registro institucional do estudante.",
      ],
      usedAI: true,
      estrutura: output,
    };
  } catch {
    const html = renderPeiHtml(normalized, fallback);
    return {
      ok: true,
      html,
      parecer: fallback.parecer,
      title: buildPeiTitle(normalized),
      pipeline: "pei-fallback",
      qualityScore: assessQuality(fallback, false),
      alertas: [
        "A IA avancada nao respondeu a tempo; o Planify entregou uma versao estruturada e revisavel do PEI.",
      ],
      usedAI: false,
      estrutura: fallback,
    };
  }
}
