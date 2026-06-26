import { appendPedagogicalGuardrails } from "@/lib/materiais/pedagogical-guardrails";
import type { BnccSelectedSkillPayload } from "@/lib/bncc/bncc-suggestion-ui";
import {
  getPeiCidOptions,
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

const SYSTEM_INSTRUCTION = appendPedagogicalGuardrails(`Você é um especialista brasileiro em educação inclusiva, AEE e elaboração de Plano Educacional Individualizado (PEI).
Produza conteúdo pedagógico, colaborativo e institucional para o professor regente e o professor do Atendimento Educacional Especializado.
O CID ou perfil informado é referência fornecida pela escola/professor; não diagnostique, não prescreva tratamento e não substitua laudo ou avaliação multiprofissional.
O PEI deve promover desenvolvimento integral, autonomia, acessibilidade curricular ou enriquecimento para Altas Habilidades/Superdotação.
Retorne SOMENTE JSON válido, sem markdown, sem HTML, com linguagem profissional e objetiva.`);

const PERIODS_BY_TRIMESTER: Record<PeiTrimestre, string[]> = {
  "1": ["Fevereiro", "Março", "Abril"],
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

function formatBnccSkillLabel(skill: BnccSelectedSkillPayload): string {
  const codigo = cleanText(skill.codigo, 40);
  const descricao = cleanText(skill.descricao, 320);
  return codigo && descricao ? `${codigo} — ${descricao}` : codigo || descricao;
}

function resolveSelectedSkills(payload: PeiGenerationRequest): BnccSelectedSkillPayload[] {
  if (!Array.isArray(payload.habilidadesSelecionadas)) {
    return [];
  }

  return payload.habilidadesSelecionadas
    .map((skill) => ({
      codigo: cleanText(skill.codigo, 40),
      descricao: cleanText(skill.descricao, 320),
      etapa: cleanText(skill.etapa, 80) || undefined,
      anoSerie: cleanText(skill.anoSerie, 80) || undefined,
      area: cleanText(skill.area, 120) || undefined,
      componente: cleanText(skill.componente, 120) || undefined,
      conteudo: cleanText(skill.conteudo, 220) || undefined,
    }))
    .filter((skill) => skill.codigo && skill.descricao);
}

function findSkillForConteudo(
  conteudo: string,
  skills: BnccSelectedSkillPayload[],
): BnccSelectedSkillPayload | null {
  const normalized = conteudo.trim().toLowerCase();
  if (!normalized) return skills[0] ?? null;

  const exact = skills.find(
    (skill) => String(skill.conteudo || "").trim().toLowerCase() === normalized,
  );
  if (exact) return exact;

  const partial = skills.find((skill) => {
    const skillConteudo = String(skill.conteudo || "").trim().toLowerCase();
    return (
      skillConteudo &&
      (skillConteudo.includes(normalized) || normalized.includes(skillConteudo))
    );
  });
  if (partial) return partial;

  return skills[0] ?? null;
}

function resolveCidCodes(payload: PeiGenerationRequest): string[] {
  const fromList = Array.isArray(payload.cids) ? payload.cids : [];
  const fromLegacy = payload.cid ? [payload.cid] : [];
  return uniqueClean([...fromList, ...fromLegacy]).slice(0, 6);
}

function resolveCidOptions(payload: PeiGenerationRequest) {
  return getPeiCidOptions(resolveCidCodes(payload));
}

function normalizeRequest(payload: PeiGenerationRequest): PeiGenerationRequest {
  const disciplina = cleanText(payload.disciplina || "Língua Portuguesa", 120);
  const discipline = getPeiDisciplineOption(disciplina);
  const cidCodes = resolveCidCodes(payload);
  const conteudos = uniqueClean(payload.conteudos, discipline.conteudos).slice(0, 8);
  const habilidadesSelecionadas = resolveSelectedSkills(payload).slice(0, 12);

  return {
    ...payload,
    etapa: cleanText(payload.etapa || "Ensino Médio", 80),
    anoSerie: cleanText(payload.anoSerie, 80),
    disciplina,
    areaConhecimento:
      cleanText(payload.areaConhecimento, 120) || discipline.area,
    cid: cidCodes[0] ?? "",
    cids: cidCodes,
    conteudos,
    habilidadesSelecionadas,
    trimestre: payload.trimestre || "todos",
  };
}

export function validatePeiPayload(payload: PeiGenerationRequest): string | null {
  if (!payload || typeof payload !== "object") {
    return "Requisicao invalida.";
  }

  if (resolveCidCodes(payload).length === 0) {
    return "Selecione ao menos um CID ou perfil educacional do estudante.";
  }

  if (!cleanText(payload.disciplina)) {
    return "Selecione a disciplina/componente curricular.";
  }

  if (!cleanText(payload.anoSerie)) {
    return "Informe o ano ou série do estudante.";
  }

  if (!Array.isArray(payload.conteudos) || payload.conteudos.length === 0) {
    return "Informe ao menos um conteúdo curricular.";
  }

  const skills = resolveSelectedSkills(payload);
  if (skills.length === 0) {
    return "Selecione ao menos uma habilidade BNCC compatível com os conteúdos.";
  }

  return null;
}

function buildFallbackOutput(payload: PeiGenerationRequest): PeiStructuredOutput {
  const cidOptions = resolveCidOptions(payload);
  const cidSummary = cidOptions.map((cid) => cid.label).join("; ");
  const isEnrichment = cidOptions.some((cid) => cid.codigo === "AHSD");
  const periods = PERIODS_BY_TRIMESTER[payload.trimestre] ?? PERIODS_BY_TRIMESTER.todos;
  const observacoes = cleanText(payload.observacoes, 700);

  const perfilParts = [
    `Estudante acompanhado em PEI para garantir acesso ao currículo de ${payload.disciplina}, considerando as referências informadas: ${cidSummary}.`,
    "O planejamento deve partir das habilidades já demonstradas, dos interesses do estudante e de evidências coletadas em sala e na Sala de Recursos Multifuncionais.",
    observacoes ? `Observações complementares registradas pelo professor: ${observacoes}.` : "",
  ].filter(Boolean);

  const supportBase = [
    ...cidOptions.flatMap((cid) => cid.suportes),
    "Mediação pedagógica pelo professor regente articulada ao AEE",
    "Fragmentação de comandos, exemplos modelados e checagem de compreensão",
    "Registro contínuo de avanços, ajustes necessários e estratégias efetivas",
  ];

  const acessibilidade = isEnrichment
    ? [
        "Enriquecimento curricular por investigação, projetos autorais e aprofundamento conceitual.",
        "Flexibilização de produto final, permitindo pesquisa, protótipo, apresentação ou curadoria.",
        "Metas de autonomia, autoria, colaboração e socialização de descobertas.",
        "Articulação com AEE/equipe escolar para acompanhamento socioemocional e desafios adequados.",
      ]
    : [
        "Priorização dos objetivos essenciais sem retirar o estudante do currículo comum.",
        "Adequação de linguagem, tempo, recursos e forma de resposta conforme demandas pedagógicas identificadas.",
        "Uso de apoio visual, material concreto/digital, modelos e pistas graduadas.",
        "Avaliação formativa, processual e multimodal, com critérios flexibilizados quando necessário.",
      ];

  const selectedSkills = resolveSelectedSkills(payload);
  const skillLabels = selectedSkills.map(formatBnccSkillLabel);

  const curricularRows = payload.conteudos.map((conteudo) => {
    const matchedSkill = findSkillForConteudo(conteudo, selectedSkills);
    const habilidade = matchedSkill
      ? formatBnccSkillLabel(matchedSkill)
      : skillLabels[0] || "Habilidade BNCC selecionada";
    return {
      conteudo,
      habilidade,
      objetivo: isEnrichment
        ? `Aprofundar ${conteudo.toLowerCase()} por investigação orientada, relacionando a habilidade selecionada a um produto autoral.`
        : `Acessar ${conteudo.toLowerCase()} por meio de objetivos essenciais, com apoio para compreender, praticar e demonstrar a habilidade selecionada.`,
      adaptacao: isEnrichment
        ? "Propor desafio ampliado, pesquisa guiada, fontes diversificadas e socialização do produto."
        : "Oferecer comandos curtos, exemplo resolvido, recurso visual/concreto, tempo ampliado e resposta oral, escrita, digital ou por esquema.",
    };
  });

  const planejamento = periods.map((periodo, index) => ({
    periodo,
    metodologia:
      index === 0
        ? "Acolhimento, sondagem pedagógica funcional, ensino estruturado, modelagem e combinados de rotina."
        : index === 1
          ? "Práticas guiadas em pequenos passos, mediação por pares, pistas graduadas e retomadas frequentes."
          : "Aplicação em situações contextualizadas, generalização das aprendizagens e autonomia progressiva.",
    recursos:
      "Slides ou cartazes visuais, atividades impressas adaptadas, organizadores gráficos, tecnologia assistiva quando disponível e jogos pedagógicos.",
    avaliacao:
      "Avaliação formativa e processual por observação, produções, registro de participação, autoavaliação mediada e critérios individualizados.",
  }));

  const student = cleanText(payload.estudanteNome, 120) || "o estudante";
  const parecer = [
    `No período planejado, ${student} deverá ser acompanhado por PEI elaborado de forma colaborativa entre professor regente, AEE e equipe escolar.`,
    isEnrichment
      ? `As ações propostas priorizam enriquecimento curricular, aprofundamento, autoria e ampliação de desafios em ${payload.disciplina}.`
      : `As ações propostas priorizam acessibilidade curricular, participação nas atividades comuns e desenvolvimento gradual de autonomia em ${payload.disciplina}.`,
    `Recomenda-se manter registros sistemáticos de progresso, ajustar recursos conforme as evidências e garantir que as avaliações considerem as estratégias previstas neste plano.`,
  ].join(" ");

  return {
    perfil: perfilParts.join(" "),
    suportes: uniqueClean(supportBase).slice(0, 8),
    acessibilidade,
    objetivos: skillLabels.slice(0, 5).map((habilidade) =>
      isEnrichment
        ? `Ampliar a habilidade "${habilidade}" por meio de investigação, autoria e socialização.`
        : `Desenvolver a habilidade "${habilidade}" com mediação, recursos acessíveis e progressão por etapas.`,
    ),
    curricularRows,
    planejamento,
    articulacao: [
      "Professor regente e AEE devem revisar o plano periodicamente, analisando evidências de participação, aprendizagem e autonomia.",
      "A Sala de Recursos Multifuncionais deve apoiar recursos, estratégias, comunicação acessível e acompanhamento dos apoios planejados.",
      "Equipe pedagógica, família e demais profissionais devem ser envolvidos quando suas informações contribuírem para o acesso ao currículo.",
    ],
    parecer,
  };
}

function buildPrompt(payload: PeiGenerationRequest): string {
  const cidOptions = resolveCidOptions(payload);
  const discipline = getPeiDisciplineOption(payload.disciplina);
  const selectedSkills = resolveSelectedSkills(payload);
  return [
    "Gere os campos de um PEI com base nestes dados.",
    "Use linguagem institucional, concreta, revisável pelo professor e adequada ao Brasil.",
    "Não invente laudos, histórico clínico, BNCC codificada nem informações não fornecidas.",
    "Inclua acessibilidade curricular ou enriquecimento quando o perfil for AH/SD.",
    "O parecer deve ter 1 a 3 parágrafos, foco pedagógico e indicar acompanhamento colaborativo.",
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
          habilidadesSelecionadas: selectedSkills,
          trimestre: payload.trimestre,
        },
        referencias: cidOptions.map((cid) => ({
          cid: cid.codigo,
          label: cid.label,
          categoria: cid.categoria,
          suportesSugeridos: cid.suportes,
        })),
        contextoPedagogico: {
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
  const cidOptions = resolveCidOptions(payload);
  const cidSummary = cidOptions.map((cid) => cid.label).join("; ");
  const cidCategories = uniqueClean(cidOptions.map((cid) => cid.categoria)).join("; ");
  const title = buildPeiTitle(payload);
  const turma = cleanText(payload.turma || payload.className, 120);

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
    <p><strong>Finalidade:</strong> assegurar acesso ao currículo, desenvolvimento integral, participação e autonomia do estudante por meio de medidas individualizadas e colaborativas.</p>
  </header>

  <section class="pei-note">
    <strong>Observação institucional:</strong> O PEI é documento obrigatório e deve ser elaborado de forma colaborativa pelo professor regente da classe regular, em conjunto com o professor do Atendimento Educacional Especializado, considerando especificidades do estudante, acessibilidade curricular ou enriquecimento para Altas Habilidades/Superdotação, atividades da Sala de Recursos Multifuncionais e articulação com os profissionais da escola.
  </section>

  <section>
    <h2>1. Identificação do estudante</h2>
    <table>
      <tbody>
        ${tableRows([
          ["Nome", cleanText(payload.estudanteNome, 120)],
          ["Data de nascimento", formatDateInput(payload.dataNascimento)],
          ["Etapa", payload.etapa],
          ["Ano/Série", payload.anoSerie],
          ["Turma", turma],
          ["Turno", cleanText(payload.turno, 80)],
          ["Professor(a) regente", cleanText(payload.professorRegente, 120)],
          ["Professor(a) do AEE/SRM", cleanText(payload.professorAee, 120)],
        ])}
      </tbody>
    </table>
  </section>

  <section>
    <h2>2. Referência pedagógica e perfil funcional</h2>
    <table>
      <tbody>
        ${tableRows([
          ["CID/perfil informado(s)", cidSummary],
          ["Categoria(s)", cidCategories],
          ["Área do conhecimento", cleanText(payload.areaConhecimento, 120)],
          ["Componente curricular", payload.disciplina],
          ["Trimestre(s)", trimestreLabel(payload.trimestre)],
        ])}
      </tbody>
    </table>
    <p>${escapeHtml(output.perfil)}</p>
    <p><strong>Nota:</strong> o(s) CID/perfil(is) selecionado(s) são referência informada pelo professor/escola para orientar acessibilidade pedagógica. O Planify não realiza diagnóstico.</p>
  </section>

  <section>
    <h2>3. Tipo(s) de suporte(s) para a realização das atividades</h2>
    ${listHtml(output.suportes)}
  </section>

  <section>
    <h2>4. Plano de acessibilidade curricular ou enriquecimento</h2>
    ${listHtml(output.acessibilidade)}
    <h3>Objetivos individualizados</h3>
    ${listHtml(output.objetivos)}
  </section>

  <section>
    <h2>5. Conteúdos, habilidades e estratégias</h2>
    <table>
      <thead>
        <tr>
          <th>Unidades temáticas / Conteúdos</th>
          <th>Habilidades</th>
          <th>Objetivos individualizados</th>
          <th>Estratégias e adaptações</th>
        </tr>
      </thead>
      <tbody>${curricularRows}</tbody>
    </table>
  </section>

  <section>
    <h2>6. Planejamento das ações</h2>
    <table>
      <thead>
        <tr>
          <th>Data / período</th>
          <th>Metodologias</th>
          <th>Recursos utilizados</th>
          <th>Avaliação</th>
        </tr>
      </thead>
      <tbody>${planningRows}</tbody>
    </table>
  </section>

  <section>
    <h2>7. Articulação entre professor regente, AEE e equipe escolar</h2>
    ${listHtml(output.articulacao)}
  </section>

  <section>
    <h2>8. Parecer pedagógico individualizado</h2>
    <p>${escapeHtml(output.parecer)}</p>
  </section>

  <section>
    <h2>9. Revisão e acompanhamento</h2>
    <p>Este PEI deve ser revisado durante o período letivo a partir de evidências de aprendizagem, autonomia, participação e estratégias que demonstraram efetividade.</p>
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
        "Revise o PEI com os profissionais responsáveis antes de anexar ao registro institucional do estudante.",
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
        "A IA avançada não respondeu a tempo; o Planify entregou uma versão estruturada e revisável do PEI.",
      ],
      usedAI: false,
      estrutura: fallback,
    };
  }
}
