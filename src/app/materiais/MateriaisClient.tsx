"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { downloadDocxDocument } from "../../lib/downloads/docx-download-client";
import { buildVisualGameMaterial } from "../../lib/materiais/game-builder";

type MaterialType =
  | "atividade"
  | "prova"
  | "apostila"
  | "sequencia"
  | "jogo"
  | "projeto"
  | "roteiro";

type GameModel =
  | "caca_palavras"
  | "cruzadinha"
  | "bingo"
  | "memoria"
  | "domino"
  | "quiz"
  | "cartas";

type FormState = {
  titulo: string;
  escola: string;
  professor: string;
  etapa: string;
  anoSerie: string;
  areaConhecimento: string;
  componenteCurricular: string;
  tema: string;
  tipo: MaterialType;
  modeloJogo: GameModel;
  quantidadeQuestoes: string;
  duracao: string;
  objetivos: string;
  conteudos: string;
  orientacoes: string;
  observacoes: string;
};

type StatusState = {
  type: "idle" | "info" | "success" | "error";
  message: string;
};

type MaterialSection = {
  titulo: string;
  descricao?: string;
  conteudo?: string;
  itens?: string[];
  visualHtml?: string;
};

type MaterialQuestion = {
  numero: number;
  tipo?: string;
  enunciado: string;
  alternativas?: string[];
  respostaEsperada?: string;
  criterioCorrecao?: string;
};

type GeneratedMaterial = {
  tipo: string;
  titulo: string;
  subtitulo?: string;
  resumo?: string;
  dadosGerais: {
    escola?: string;
    professor?: string;
    etapa?: string;
    anoSerie?: string;
    areaConhecimento?: string;
    componenteCurricular?: string;
    tema?: string;
    duracao?: string;
  };
  objetivos?: string[];
  conteudos?: string[];
  introducao?: string;
  orientacoesProfessor?: string[];
  orientacoesAluno?: string[];
  secoes?: MaterialSection[];
  questoes?: MaterialQuestion[];
  gabarito?: string[];
  jogo?: {
    nome: string;
    tipoJogo?: string;
    objetivo: string;
    materiais: string[];
    preparacao: string[];
    regras: string[];
    modoDeJogar: string[];
    variacoes?: string[];
    fechamento?: string;
  } | null;
  criteriosAvaliacao?: string[];
  adaptacoesInclusivas?: string[];
  sugestoesUso?: string[];
  alertas?: string[];
  visualHtml?: string;
  printHtml?: string;
};

const initialForm: FormState = {
  titulo: "",
  escola: "",
  professor: "",
  etapa: "Ensino Médio",
  anoSerie: "1ª série",
  areaConhecimento: "Linguagens e suas Tecnologias",
  componenteCurricular: "Língua Espanhola",
  tema: "",
  tipo: "jogo",
  modeloJogo: "caca_palavras",
  quantidadeQuestoes: "10",
  duracao: "1 período",
  objetivos: "",
  conteudos: "",
  orientacoes: "",
  observacoes: "",
};

const exemploJogo: FormState = {
  ...initialForm,
  titulo: "Caça-palavras visual — Mundo Hispânico",
  tema: "Países hispânicos, saudações e cultura",
  modeloJogo: "caca_palavras",
  conteudos:
    "Países hispânicos\nSaudações em espanhol\nVocabulário de apresentação\nCultura e diversidade\nVariação linguística\nAmérica Latina",
  objetivos: "Revisar vocabulário e aspectos culturais da Língua Espanhola por meio de jogo visual imprimível.",
  orientacoes: "Gerar jogo pronto para imprimir, com versão do aluno, gabarito e abertura no Editor.",
};

const exemploAtividade: FormState = {
  ...initialForm,
  titulo: "Atividade de leitura e interpretação",
  etapa: "Ensino Fundamental",
  anoSerie: "6º ano",
  areaConhecimento: "",
  componenteCurricular: "Língua Portuguesa",
  tipo: "atividade",
  tema: "Leitura e interpretação de textos",
  quantidadeQuestoes: "10",
  duracao: "2 períodos",
  conteudos:
    "Leitura de texto narrativo\nLocalização de informações explícitas\nInferência de sentidos\nProdução de respostas escritas",
  objetivos: "Desenvolver leitura, interpretação e produção escrita.",
};

const etapaOptions = ["Educação Infantil", "Ensino Fundamental", "Ensino Médio"];

const anoSerieByEtapa: Record<string, string[]> = {
  "Educação Infantil": ["Creche", "Pré-escola"],
  "Ensino Fundamental": ["1º ano", "2º ano", "3º ano", "4º ano", "5º ano", "6º ano", "7º ano", "8º ano", "9º ano"],
  "Ensino Médio": ["1ª série", "2ª série", "3ª série"],
};

const componentesByEtapa: Record<string, string[]> = {
  "Educação Infantil": [
    "Campos de experiências",
    "O eu, o outro e o nós",
    "Corpo, gestos e movimentos",
    "Traços, sons, cores e formas",
    "Escuta, fala, pensamento e imaginação",
    "Espaços, tempos, quantidades, relações e transformações",
  ],
  "Ensino Fundamental": [
    "Língua Portuguesa",
    "Arte",
    "Educação Física",
    "Língua Inglesa",
    "Língua Espanhola",
    "Matemática",
    "Ciências",
    "História",
    "Geografia",
    "Ensino Religioso",
  ],
  "Ensino Médio": [],
};

const areasEnsinoMedio = [
  "Linguagens e suas Tecnologias",
  "Matemática e suas Tecnologias",
  "Ciências da Natureza e suas Tecnologias",
  "Ciências Humanas e Sociais Aplicadas",
];

const componentesEnsinoMedio: Record<string, string[]> = {
  "Linguagens e suas Tecnologias": ["Língua Portuguesa", "Arte", "Educação Física", "Língua Inglesa", "Língua Espanhola"],
  "Matemática e suas Tecnologias": ["Matemática"],
  "Ciências da Natureza e suas Tecnologias": ["Biologia", "Física", "Química"],
  "Ciências Humanas e Sociais Aplicadas": ["História", "Geografia", "Filosofia", "Sociologia"],
};

const materialTypes: Array<{ value: MaterialType; label: string; description: string }> = [
  { value: "jogo", label: "Jogo pedagógico visual", description: "Caça-palavras, bingo, memória, dominó, quiz e cartas recortáveis." },
  { value: "atividade", label: "Atividade", description: "Questões orientadas com resposta esperada." },
  { value: "prova", label: "Prova", description: "Avaliação com gabarito e critérios." },
  { value: "apostila", label: "Apostila", description: "Explicação didática, exemplos e exercícios." },
  { value: "sequencia", label: "Sequência didática", description: "Etapas de aula e mediações." },
  { value: "projeto", label: "Projeto", description: "Problema, etapas e produto final." },
  { value: "roteiro", label: "Roteiro de estudo", description: "Estudo autônomo orientado." },
];

const gameModelOptions: Array<{ value: GameModel; label: string; description: string }> = [
  { value: "caca_palavras", label: "Caça-palavras", description: "Grade real com quadradinhos, banco de palavras e gabarito." },
  { value: "cruzadinha", label: "Cruzadinha", description: "Quadradinhos de resposta, pistas numeradas e gabarito." },
  { value: "bingo", label: "Bingo", description: "Seis cartelas diferentes e lista de chamada do professor." },
  { value: "memoria", label: "Memória", description: "Cartas recortáveis de conceito e pista." },
  { value: "domino", label: "Dominó", description: "Peças retangulares recortáveis para associação." },
  { value: "quiz", label: "Quiz", description: "Cartões de perguntas e folha de pontuação." },
  { value: "cartas", label: "Cartas", description: "Baralho pedagógico com desafios recortáveis." },
];

const typeLabels: Record<MaterialType, string> = {
  atividade: "Atividade",
  prova: "Prova",
  apostila: "Apostila",
  sequencia: "Sequência didática",
  jogo: "Jogo pedagógico visual",
  projeto: "Projeto",
  roteiro: "Roteiro de estudo",
};

const gameLabels: Record<GameModel, string> = {
  caca_palavras: "Caça-palavras",
  cruzadinha: "Cruzadinha",
  bingo: "Bingo pedagógico",
  memoria: "Jogo da memória",
  domino: "Dominó pedagógico",
  quiz: "Quiz com gabarito",
  cartas: "Cartas recortáveis",
};

function splitLines(value: string) {
  return value
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isEnsinoMedio(etapa: string) {
  return etapa === "Ensino Médio";
}

function needsQuestionQuantity(tipo: MaterialType) {
  return tipo === "atividade" || tipo === "prova";
}

function getComponentesDisponiveis(form: FormState) {
  if (isEnsinoMedio(form.etapa)) {
    return form.areaConhecimento ? componentesEnsinoMedio[form.areaConhecimento] || [] : [];
  }
  return componentesByEtapa[form.etapa] || [];
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function validateForm(form: FormState): string | null {
  if (!form.anoSerie) return "Selecione o ano/série.";
  if (isEnsinoMedio(form.etapa) && !form.areaConhecimento) return "Selecione a área do conhecimento.";
  if (!form.componenteCurricular) return "Selecione o componente curricular.";
  if (!form.tema.trim()) return "Informe o tema central.";
  if (splitLines(form.conteudos).length === 0) return "Informe ao menos um conteúdo.";
  if (needsQuestionQuantity(form.tipo) && !form.quantidadeQuestoes.trim()) return "Informe a quantidade de questões.";
  return null;
}

function materialFromVisualBuilder(form: FormState): GeneratedMaterial {
  return buildVisualGameMaterial({
    ...form,
    titulo: form.titulo || `${gameLabels[form.modeloJogo]} — ${form.tema}`,
    conteudos: splitLines(form.conteudos),
  }) as GeneratedMaterial;
}

function buildFallbackMaterial(form: FormState): GeneratedMaterial {
  if (form.tipo === "jogo") return materialFromVisualBuilder(form);

  const conteudos = splitLines(form.conteudos);
  const quantidade = Number(form.quantidadeQuestoes) || 5;
  return {
    tipo: typeLabels[form.tipo],
    titulo: form.titulo || `${typeLabels[form.tipo]} — ${form.tema}`,
    subtitulo: `${typeLabels[form.tipo]} — ${form.componenteCurricular}`,
    resumo: "Material estruturado para apoiar a prática docente com objetivos claros e linguagem adequada à turma.",
    dadosGerais: {
      escola: form.escola,
      professor: form.professor,
      etapa: form.etapa,
      anoSerie: form.anoSerie,
      areaConhecimento: form.areaConhecimento,
      componenteCurricular: form.componenteCurricular,
      tema: form.tema,
      duracao: form.duracao,
    },
    objetivos: splitLines(form.objetivos).length ? splitLines(form.objetivos) : [`Desenvolver aprendizagem sobre ${form.tema}.`],
    conteudos,
    introducao: "Material didático estruturado para aplicação em sala, revisão e edição no Planify Editor.",
    orientacoesProfessor: ["Apresente os objetivos.", "Acompanhe a realização.", "Finalize com correção coletiva."],
    orientacoesAluno: ["Leia os comandos com atenção.", "Registre suas respostas.", "Revise antes de entregar."],
    secoes: conteudos.map((conteudo, index) => ({
      titulo: `Seção ${index + 1}: ${conteudo}`,
      conteudo: `Atividades orientadas para desenvolver o conteúdo ${conteudo}.`,
      itens: ["Retomada", "Exploração guiada", "Registro", "Socialização"],
    })),
    questoes: needsQuestionQuantity(form.tipo)
      ? Array.from({ length: quantidade }).map((_, index) => ({
          numero: index + 1,
          tipo: "discursiva",
          enunciado: `Questão ${index + 1}: responda uma situação relacionada ao tema ${form.tema}.`,
          alternativas: [],
          respostaEsperada: "Resposta coerente com o conteúdo estudado.",
          criterioCorrecao: "Considerar compreensão, organização e relação com o conteúdo.",
        }))
      : [],
    gabarito: needsQuestionQuantity(form.tipo)
      ? Array.from({ length: quantidade }).map((_, index) => `Questão ${index + 1}: resposta esperada conforme o conteúdo.`)
      : [],
    jogo: null,
    criteriosAvaliacao: ["Participação", "Compreensão", "Organização", "Argumentação"],
    adaptacoesInclusivas: ["Permitir apoio em dupla quando necessário.", "Adaptar tempo e quantidade conforme a turma."],
    sugestoesUso: ["Usar em sala, reforço, tarefa ou revisão."],
    alertas: [],
  };
}

function normalizeGeneratedMaterial(material: GeneratedMaterial, form: FormState): GeneratedMaterial {
  if (form.tipo === "jogo") {
    const visual = material.visualHtml || material.printHtml;
    if (!visual || !material.jogo) return materialFromVisualBuilder(form);
  }

  return {
    ...material,
    tipo: material.tipo || form.tipo,
    titulo: material.titulo || form.titulo || `${typeLabels[form.tipo]} — ${form.tema}`,
    subtitulo: material.subtitulo || `${typeLabels[form.tipo]} — ${form.componenteCurricular}`,
    resumo: material.resumo || "Material didático gerado com base nos dados informados.",
    dadosGerais: {
      escola: form.escola,
      professor: form.professor,
      etapa: form.etapa,
      anoSerie: form.anoSerie,
      areaConhecimento: form.areaConhecimento,
      componenteCurricular: form.componenteCurricular,
      tema: form.tema,
      duracao: form.duracao,
      ...material.dadosGerais,
    },
    objetivos: material.objetivos || splitLines(form.objetivos),
    conteudos: material.conteudos || splitLines(form.conteudos),
    orientacoesProfessor: material.orientacoesProfessor || [],
    orientacoesAluno: material.orientacoesAluno || [],
    secoes: material.secoes || [],
    questoes: material.questoes || [],
    gabarito: material.gabarito || [],
    criteriosAvaliacao: material.criteriosAvaliacao || [],
    adaptacoesInclusivas: material.adaptacoesInclusivas || [],
    sugestoesUso: material.sugestoesUso || [],
    alertas: material.alertas || [],
  };
}

function saveToLocalHistory(material: GeneratedMaterial) {
  const item = {
    id: crypto.randomUUID(),
    type: "material",
    title: material.titulo,
    subtitle: `${material.tipo} • ${material.dadosGerais.componenteCurricular || "Componente não informado"}`,
    createdAt: new Date().toISOString(),
    content: material,
  };

  const key = "planify_history";
  const current = JSON.parse(localStorage.getItem(key) || "[]") as unknown[];
  localStorage.setItem(key, JSON.stringify([item, ...current].slice(0, 50)));
}

async function downloadDocument(material: GeneratedMaterial) {
  await downloadDocxDocument("material", material, material.titulo || "material-planify");
}

function renderList(items: string[] | undefined) {
  const valid = (items || []).filter(Boolean);
  if (valid.length === 0) return "";
  return `<ul>${valid.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderTextBlock(value: string | undefined) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br />")}</p>`)
    .join("");
}

function buildMaterialEditorHtml(material: GeneratedMaterial) {
  const dados = material.dadosGerais || {};
  const sections = material.secoes || [];
  const questions = material.questoes || [];
  const visualHtml = material.visualHtml || material.printHtml || "";

  return `
<article class="planify-doc">
  <h1>${escapeHtml(material.titulo || "Material Planify")}</h1>
  ${material.subtitulo ? `<p><em>${escapeHtml(material.subtitulo)}</em></p>` : ""}
  ${material.resumo ? `<p>${escapeHtml(material.resumo)}</p>` : ""}

  <h2>Dados gerais</h2>
  <table>
    <tbody>
      ${[
        ["Escola", dados.escola],
        ["Professor", dados.professor],
        ["Etapa", dados.etapa],
        ["Ano/Série", dados.anoSerie],
        ["Área", dados.areaConhecimento],
        ["Componente", dados.componenteCurricular],
        ["Tema", dados.tema],
        ["Duração", dados.duracao],
      ]
        .filter(([, value]) => String(value || "").trim())
        .map(([label, value]) => `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`)
        .join("")}
    </tbody>
  </table>

  ${material.introducao ? `<h2>Introdução</h2>${renderTextBlock(material.introducao)}` : ""}
  ${(material.objetivos || []).length ? `<h2>Objetivos</h2>${renderList(material.objetivos)}` : ""}
  ${(material.conteudos || []).length ? `<h2>Conteúdos</h2>${renderList(material.conteudos)}` : ""}

  ${visualHtml ? `<div style="margin:24px 0;padding:16px;border:1px solid #cbd5e1;border-radius:12px;background:#fff;">${visualHtml}</div>` : ""}

  ${(material.orientacoesProfessor || []).length ? `<h2>Orientações ao professor</h2>${renderList(material.orientacoesProfessor)}` : ""}
  ${(material.orientacoesAluno || []).length ? `<h2>Orientações aos alunos</h2>${renderList(material.orientacoesAluno)}` : ""}

  ${!visualHtml
    ? sections
        .map((section, index) => {
          const content = section.conteudo || section.descricao || "";
          return `<h2>${index + 1}. ${escapeHtml(section.titulo || "Seção")}</h2>${renderTextBlock(content)}${renderList(section.itens)}`;
        })
        .join("")
    : ""}

  ${questions.length ? `<h2>Questões</h2>${questions
    .map(
      (question) => `<h3>Questão ${question.numero}</h3><p>${escapeHtml(question.enunciado)}</p>${renderList(question.alternativas)}${question.respostaEsperada ? `<p><strong>Resposta esperada:</strong> ${escapeHtml(question.respostaEsperada)}</p>` : ""}`,
    )
    .join("")}` : ""}

  ${(material.gabarito || []).length ? `<h2>Gabarito</h2>${renderList(material.gabarito)}` : ""}
  ${(material.criteriosAvaliacao || []).length ? `<h2>Critérios de avaliação</h2>${renderList(material.criteriosAvaliacao)}` : ""}
  ${(material.adaptacoesInclusivas || []).length ? `<h2>Adaptações inclusivas</h2>${renderList(material.adaptacoesInclusivas)}` : ""}
  ${(material.sugestoesUso || []).length ? `<h2>Sugestões de uso</h2>${renderList(material.sugestoesUso)}` : ""}
</article>`.trim();
}

export function MateriaisClient() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<StatusState>({ type: "idle", message: "Preencha poucos campos essenciais e gere o material." });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMaterial, setGeneratedMaterial] = useState<GeneratedMaterial | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const conteudos = useMemo(() => splitLines(form.conteudos), [form.conteudos]);
  const componentesDisponiveis = useMemo(() => getComponentesDisponiveis(form), [form]);
  const selectedGameModel = gameModelOptions.find((item) => item.value === form.modeloJogo);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "etapa") {
        next.anoSerie = "";
        next.areaConhecimento = value === "Ensino Médio" ? "Linguagens e suas Tecnologias" : "";
        next.componenteCurricular = value === "Ensino Médio" ? "Língua Espanhola" : "";
      }
      if (key === "areaConhecimento") next.componenteCurricular = "";
      if (key === "tipo" && value === "jogo") {
        next.quantidadeQuestoes = "";
        next.modeloJogo = next.modeloJogo || "caca_palavras";
      }
      if (key === "tipo" && value !== "jogo" && !next.quantidadeQuestoes) next.quantidadeQuestoes = "10";
      return next;
    });
  }

  function clearAll() {
    setForm(initialForm);
    setGeneratedMaterial(null);
    setStatus({ type: "idle", message: "Campos limpos. Comece novamente pelos campos essenciais." });
  }

  function applyExample(type: "atividade" | "jogo") {
    setForm(type === "atividade" ? exemploAtividade : exemploJogo);
    setGeneratedMaterial(null);
    setStatus({ type: "info", message: type === "jogo" ? "Exemplo de jogo visual aplicado." : "Exemplo de atividade aplicado." });
  }

  async function generateMaterial() {
    const validation = validateForm(form);
    if (validation) {
      setStatus({ type: "error", message: validation });
      return;
    }

    setIsGenerating(true);
    setStatus({ type: "info", message: form.tipo === "jogo" ? `Montando ${selectedGameModel?.label || "jogo"} visual com IA e construtor Planify...` : "Gerando material didático com IA..." });

    try {
      const response = await fetch("/api/ai/material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, titulo: form.titulo || `${typeLabels[form.tipo]} — ${form.tema}` }),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error?.message || result?.message || "Não foi possível gerar material agora.");
      }
      const material = normalizeGeneratedMaterial((result.data || result.material) as GeneratedMaterial, form);
      setGeneratedMaterial(material);
      saveToLocalHistory(material);
      setStatus({ type: "success", message: form.tipo === "jogo" ? "Jogo visual gerado com material real para imprimir, editar e aplicar." : "Material gerado com IA." });
    } catch (error) {
      const fallback = buildFallbackMaterial(form);
      setGeneratedMaterial(fallback);
      saveToLocalHistory(fallback);
      setStatus({
        type: "success",
        message: error instanceof Error ? `A IA não respondeu agora. O construtor Planify gerou uma versão visual premium. Detalhe: ${error.message}` : "O construtor Planify gerou uma versão visual premium.",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  function openInEditor() {
    if (!generatedMaterial) return;
    const html = buildMaterialEditorHtml(generatedMaterial);
    localStorage.setItem(
      "planify_editor_document",
      JSON.stringify({ type: "material", title: generatedMaterial.titulo || "Material Planify", html, content: html, updatedAt: new Date().toISOString() }),
    );
    window.location.href = "/editor";
  }

  const statusClass =
    status.type === "success"
      ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
      : status.type === "error"
        ? "border-rose-300/30 bg-rose-300/10 text-rose-100"
        : "border-cyan-300/20 bg-cyan-300/10 text-cyan-100";

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-5 py-10 lg:grid-cols-[0.72fr_1.28fr] sm:px-8">
      <aside className="space-y-6">
        <div className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-6 shadow-2xl shadow-cyan-500/10">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-300">Gerador premium</p>
          <h1 className="mt-4 text-3xl font-black text-white">Materiais com IA</h1>
          <p className="mt-4 text-sm leading-7 text-cyan-100/80">
            Agora o modo jogo usa um construtor visual: ele monta grade, cartelas, cartas e peças reais para abrir no Editor.
          </p>

          <div className="mt-6 grid gap-3">
            {[
              ["Tipo", form.tipo === "jogo" ? selectedGameModel?.label || "Jogo" : typeLabels[form.tipo]],
              ["Conteúdos", String(conteudos.length)],
              ["Componente", form.componenteCurricular || "Selecione"],
              ["Status", isGenerating ? "Gerando" : "Pronto"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">{label}</p>
                <p className="mt-2 text-xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3">
            <button type="button" onClick={() => applyExample("jogo")} className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 text-sm font-black text-cyan-100 transition hover:-translate-y-1 hover:bg-cyan-300/20">
              Exemplo de jogo visual
            </button>
            <button type="button" onClick={() => applyExample("atividade")} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10">
              Exemplo de atividade
            </button>
          </div>
        </div>

        {form.tipo === "jogo" && (
          <div className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-6 shadow-2xl shadow-emerald-500/10">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-200">Escolha o jogo</p>
            <div className="mt-4 grid gap-3">
              {gameModelOptions.map((game) => (
                <button
                  key={game.value}
                  type="button"
                  onClick={() => updateField("modeloJogo", game.value)}
                  className={`rounded-2xl border px-4 py-3 text-left transition hover:-translate-y-0.5 ${
                    form.modeloJogo === game.value
                      ? "border-emerald-200/60 bg-white text-slate-950"
                      : "border-white/10 bg-slate-950/40 text-emerald-50 hover:bg-white/10"
                  }`}
                >
                  <span className="block text-sm font-black">{game.label}</span>
                  <span className="mt-1 block text-xs leading-5 opacity-80">{game.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={`rounded-[1.5rem] border p-5 text-sm leading-7 ${statusClass}`}>
          <p className="font-black uppercase tracking-[0.2em]">Status</p>
          <p className="mt-2">{status.message}</p>
        </div>
      </aside>

      <div className="space-y-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-300">Campos essenciais</p>
              <h2 className="mt-3 text-3xl font-black text-white">Crie com menos preenchimento</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                Para jogos, basta escolher etapa, componente, tipo, tema e conteúdos. Escola, professor e objetivos ficam em dados avançados.
              </p>
            </div>
            <button type="button" onClick={clearAll} className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10">
              Limpar tudo
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-bold text-slate-300">Título opcional</span>
              <input value={form.titulo} onChange={(event) => updateField("titulo", event.target.value)} placeholder="Se deixar vazio, o Planify cria automaticamente" className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50" />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">Etapa</span>
              <select value={form.etapa} onChange={(event) => updateField("etapa", event.target.value)} className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition focus:border-cyan-300/50">
                {etapaOptions.map((item) => <option key={item} value={item} className="bg-slate-950">{item}</option>)}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">Ano/Série</span>
              <select value={form.anoSerie} onChange={(event) => updateField("anoSerie", event.target.value)} className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition focus:border-cyan-300/50">
                <option value="" className="bg-slate-950">Selecione</option>
                {(anoSerieByEtapa[form.etapa] || []).map((item) => <option key={item} value={item} className="bg-slate-950">{item}</option>)}
              </select>
            </label>

            {isEnsinoMedio(form.etapa) && (
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-300">Área do conhecimento</span>
                <select value={form.areaConhecimento} onChange={(event) => updateField("areaConhecimento", event.target.value)} className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition focus:border-cyan-300/50">
                  <option value="" className="bg-slate-950">Selecione</option>
                  {areasEnsinoMedio.map((item) => <option key={item} value={item} className="bg-slate-950">{item}</option>)}
                </select>
              </label>
            )}

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">Componente curricular</span>
              <select value={form.componenteCurricular} onChange={(event) => updateField("componenteCurricular", event.target.value)} className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition focus:border-cyan-300/50">
                <option value="" className="bg-slate-950">{isEnsinoMedio(form.etapa) && !form.areaConhecimento ? "Selecione a área primeiro" : "Selecione"}</option>
                {componentesDisponiveis.map((item) => <option key={item} value={item} className="bg-slate-950">{item}</option>)}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">Tipo</span>
              <select value={form.tipo} onChange={(event) => updateField("tipo", event.target.value as MaterialType)} className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition focus:border-cyan-300/50">
                {materialTypes.map((type) => <option key={type.value} value={type.value} className="bg-slate-950">{type.label}</option>)}
              </select>
            </label>

            {form.tipo === "jogo" && (
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-300">Modelo de jogo</span>
                <select value={form.modeloJogo} onChange={(event) => updateField("modeloJogo", event.target.value as GameModel)} className="h-14 rounded-2xl border border-emerald-300/30 bg-slate-950/50 px-4 text-sm text-white outline-none transition focus:border-emerald-300/60">
                  {gameModelOptions.map((game) => <option key={game.value} value={game.value} className="bg-slate-950">{game.label}</option>)}
                </select>
              </label>
            )}

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">Tema</span>
              <input value={form.tema} onChange={(event) => updateField("tema", event.target.value)} placeholder="Ex.: Países hispânicos e cultura" className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50" />
            </label>

            {needsQuestionQuantity(form.tipo) && (
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-300">Quantidade de questões</span>
                <input value={form.quantidadeQuestoes} onChange={(event) => updateField("quantidadeQuestoes", event.target.value)} placeholder="10" className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50" />
              </label>
            )}

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">Duração opcional</span>
              <input value={form.duracao} onChange={(event) => updateField("duracao", event.target.value)} placeholder="Ex.: 1 período" className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50" />
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-bold text-slate-300">Conteúdos</span>
              <textarea value={form.conteudos} onChange={(event) => updateField("conteudos", event.target.value)} rows={5} placeholder={"Digite um conteúdo por linha.\nEx.: Países hispânicos\nEx.: Saudações em espanhol\nEx.: Cultura e diversidade"} className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50" />
            </label>

            <div className="md:col-span-2">
              <button type="button" onClick={() => setShowAdvanced((value) => !value)} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10">
                {showAdvanced ? "Ocultar dados avançados" : "Mostrar dados avançados opcionais"}
              </button>
            </div>

            {showAdvanced && (
              <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/35 p-4 md:col-span-2 md:grid-cols-2">
                <label className="grid gap-2"><span className="text-sm font-bold text-slate-300">Escola</span><input value={form.escola} onChange={(event) => updateField("escola", event.target.value)} placeholder="Nome da escola" className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none placeholder:text-slate-500" /></label>
                <label className="grid gap-2"><span className="text-sm font-bold text-slate-300">Professor</span><input value={form.professor} onChange={(event) => updateField("professor", event.target.value)} placeholder="Nome do professor" className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none placeholder:text-slate-500" /></label>
                <label className="grid gap-2 md:col-span-2"><span className="text-sm font-bold text-slate-300">Objetivos</span><textarea value={form.objetivos} onChange={(event) => updateField("objetivos", event.target.value)} rows={3} placeholder="Objetivos pedagógicos específicos" className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm text-white outline-none placeholder:text-slate-500" /></label>
                <label className="grid gap-2 md:col-span-2"><span className="text-sm font-bold text-slate-300">Orientações</span><textarea value={form.orientacoes} onChange={(event) => updateField("orientacoes", event.target.value)} rows={3} placeholder="Detalhes de impressão, grupos, dificuldade ou recortes" className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm text-white outline-none placeholder:text-slate-500" /></label>
                <label className="grid gap-2 md:col-span-2"><span className="text-sm font-bold text-slate-300">Observações</span><textarea value={form.observacoes} onChange={(event) => updateField("observacoes", event.target.value)} rows={3} placeholder="Características da turma ou adaptações" className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm text-white outline-none placeholder:text-slate-500" /></label>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={generateMaterial} disabled={isGenerating} className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60">
              {isGenerating ? "Gerando..." : form.tipo === "jogo" ? `Gerar ${selectedGameModel?.label || "jogo visual"}` : "Gerar material"}
            </button>
            <Link href="/historico" className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10">Ver histórico</Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl">
          {generatedMaterial ? (
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">Prévia</p>
              <h2 className="mt-3 text-3xl font-black text-white">{generatedMaterial.titulo}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">{generatedMaterial.resumo || generatedMaterial.introducao}</p>

              {generatedMaterial.visualHtml || generatedMaterial.printHtml ? (
                <div className="mt-6 max-h-[720px] overflow-auto rounded-2xl border border-slate-200 bg-white p-5 text-slate-900" dangerouslySetInnerHTML={{ __html: generatedMaterial.visualHtml || generatedMaterial.printHtml || "" }} />
              ) : (
                <div className="mt-6 grid gap-4">
                  {(generatedMaterial.secoes || []).slice(0, 4).map((section, index) => (
                    <div key={`${section.titulo}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Seção {index + 1}</p>
                      <h3 className="mt-2 text-xl font-black text-white">{section.titulo}</h3>
                      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-400">{section.conteudo || section.descricao}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={openInEditor} className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-cyan-100">Abrir no Editor</button>
                <button type="button" onClick={() => downloadDocument(generatedMaterial)} className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10">Baixar DOCX</button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">Prévia</p>
              <h2 className="mt-3 text-3xl font-black text-white">Aguardando geração</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">Escolha o tipo de material, informe tema e conteúdos. Se for jogo, o resultado aparecerá com grade, cartelas, cartas ou peças reais.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default MateriaisClient;
