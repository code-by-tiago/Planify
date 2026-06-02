"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { downloadDocxDocument } from "../../lib/downloads/docx-download-client";
import { buildVisualGameMaterial } from "../../lib/materiais/game-builder";

type MaterialType =
  | "atividade"
  | "prova"
  | "apostila"
  | "lista"
  | "revisao"
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

type SuggestedContent = {
  id: string;
  titulo: string;
  descricao: string;
  palavrasChave: string[];
  objetivos: string[];
  dificuldade: string;
  tempoEstimado: string;
  justificativaPedagogica: string;
};

type RecommendedOption = {
  tipo: string;
  modeloJogo?: string;
  titulo: string;
  motivo: string;
};

type SuggestionOutput = {
  tema: string;
  etapa: string;
  anoSerie: string;
  areaConhecimento?: string;
  componenteCurricular: string;
  resumoPedagogico: string;
  conteudos: SuggestedContent[];
  objetivosGerais: string[];
  palavrasChaveGerais: string[];
  materiaisRecomendados: RecommendedOption[];
  jogosRecomendados: RecommendedOption[];
  observacoesDeUso: string[];
  alertas: string[];
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
  etapa: "Ensino Fundamental",
  anoSerie: "6º ano",
  areaConhecimento: "",
  componenteCurricular: "Ensino Religioso",
  tema: "",
  tipo: "jogo",
  modeloJogo: "cruzadinha",
  quantidadeQuestoes: "10",
  duracao: "1 período",
  objetivos: "",
  conteudos: "",
  orientacoes: "",
  observacoes: "",
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
    "Redação",
    "Escrita Criativa",
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
  "Linguagens e suas Tecnologias": ["Língua Portuguesa", "Redação", "Escrita Criativa", "Arte", "Educação Física", "Língua Inglesa", "Língua Espanhola"],
  "Matemática e suas Tecnologias": ["Matemática"],
  "Ciências da Natureza e suas Tecnologias": ["Biologia", "Física", "Química"],
  "Ciências Humanas e Sociais Aplicadas": ["História", "Geografia", "Filosofia", "Sociologia"],
};

const materialTypes: Array<{ value: MaterialType; label: string; description: string }> = [
  { value: "jogo", label: "Jogo pedagógico visual", description: "Cruzadinha, caça-palavras, bingo, memória, dominó, quiz e cartas." },
  { value: "atividade", label: "Atividade", description: "Questões orientadas com resposta esperada." },
  { value: "prova", label: "Prova", description: "Avaliação com gabarito e critérios." },
  { value: "lista", label: "Lista de exercícios", description: "Exercícios em progressão: básico, intermediário e desafio." },
  { value: "revisao", label: "Revisão", description: "Retomada com síntese, exercícios e autoavaliação." },
  { value: "apostila", label: "Apostila", description: "Explicação didática, exemplos e exercícios." },
  { value: "sequencia", label: "Sequência didática", description: "Etapas de aula e mediações." },
  { value: "projeto", label: "Projeto", description: "Problema, etapas e produto final." },
  { value: "roteiro", label: "Roteiro de estudo", description: "Estudo autônomo orientado." },
];

const gameModelOptions: Array<{ value: GameModel; label: string; description: string }> = [
  { value: "cruzadinha", label: "Cruzadinha", description: "Grade cruzada, pistas horizontais/verticais e gabarito." },
  { value: "caca_palavras", label: "Caça-palavras", description: "Grade real com quadradinhos, banco de palavras e gabarito." },
  { value: "bingo", label: "Bingo", description: "Cartelas diferentes e lista de chamada do professor." },
  { value: "memoria", label: "Memória", description: "Cartas recortáveis de conceito e pista." },
  { value: "domino", label: "Dominó", description: "Peças retangulares recortáveis para associação." },
  { value: "quiz", label: "Quiz", description: "Cartões de perguntas e folha de pontuação." },
  { value: "cartas", label: "Cartas", description: "Baralho pedagógico com desafios recortáveis." },
];

const typeLabels: Record<MaterialType, string> = {
  atividade: "Atividade",
  prova: "Prova",
  lista: "Lista de exercícios",
  revisao: "Revisão",
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

const quickExamples = [
  {
    label: "Ensino Religioso",
    tema: "Jó e a fidelidade diante das provações",
    etapa: "Ensino Fundamental",
    anoSerie: "6º ano",
    componente: "Ensino Religioso",
    area: "",
    jogo: "cruzadinha" as GameModel,
  },
  {
    label: "Espanhol",
    tema: "Países hispânicos, saudações e cultura",
    etapa: "Ensino Médio",
    anoSerie: "1ª série",
    componente: "Língua Espanhola",
    area: "Linguagens e suas Tecnologias",
    jogo: "bingo" as GameModel,
  },
  {
    label: "Português",
    tema: "Leitura e interpretação de texto narrativo",
    etapa: "Ensino Fundamental",
    anoSerie: "7º ano",
    componente: "Língua Portuguesa",
    area: "",
    jogo: "quiz" as GameModel,
  },
  {
    label: "Redação",
    tema: "Argumentação, tese e repertório sociocultural",
    etapa: "Ensino Médio",
    anoSerie: "3ª série",
    componente: "Redação",
    area: "Linguagens e suas Tecnologias",
    jogo: "cartas" as GameModel,
  },
  {
    label: "Escrita Criativa",
    tema: "Criação de personagens, conflito e desfecho narrativo",
    etapa: "Ensino Fundamental",
    anoSerie: "8º ano",
    componente: "Escrita Criativa",
    area: "",
    jogo: "memoria" as GameModel,
  },
];

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
  return tipo === "atividade" || tipo === "prova" || tipo === "lista" || tipo === "revisao";
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

function contentLineFromSuggestion(item: SuggestedContent) {
  const keywords = (item.palavrasChave || []).slice(0, 8).join(", ");
  return `${item.titulo}: ${keywords || item.descricao}`;
}

function buildSelectedContentLines(items: SuggestedContent[], selectedIds: string[], manual: string) {
  const manualLines = splitLines(manual);
  if (manualLines.length) return manualLines;
  return items.filter((item) => selectedIds.includes(item.id)).map(contentLineFromSuggestion);
}

function validateForm(form: FormState, contentLines: string[]): string | null {
  if (!form.anoSerie) return "Selecione o ano/série.";
  if (isEnsinoMedio(form.etapa) && !form.areaConhecimento) return "Selecione a área do conhecimento.";
  if (!form.componenteCurricular) return "Selecione o componente curricular.";
  if (!form.tema.trim()) return "Informe o tema central.";
  if (contentLines.length === 0) return "Clique em Sugerir conteúdos inteligentes ou informe conteúdos no modo avançado.";
  if (needsQuestionQuantity(form.tipo) && !form.quantidadeQuestoes.trim()) return "Informe a quantidade de questões.";
  return null;
}

function materialFromVisualBuilder(form: FormState, conteudos: string[]): GeneratedMaterial {
  return buildVisualGameMaterial({
    ...form,
    titulo: form.titulo || `${gameLabels[form.modeloJogo]} — ${form.tema}`,
    conteudos,
  }) as GeneratedMaterial;
}

function buildFallbackMaterial(form: FormState, conteudos: string[]): GeneratedMaterial {
  if (form.tipo === "jogo") return materialFromVisualBuilder(form, conteudos);

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
      titulo: `Seção ${index + 1}: ${conteudo.split(":")[0]}`,
      conteudo: `Atividades orientadas para desenvolver: ${conteudo}.`,
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

function normalizeGeneratedMaterial(material: GeneratedMaterial, form: FormState, conteudos: string[]): GeneratedMaterial {
  if (form.tipo === "jogo") {
    const visual = material.visualHtml || material.printHtml;
    if (!visual || !material.jogo) return materialFromVisualBuilder(form, conteudos);
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
    conteudos: material.conteudos || conteudos,
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
  ${(material.conteudos || []).length ? `<h2>Conteúdos trabalhados</h2>${renderList(material.conteudos)}` : ""}

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
  const [status, setStatus] = useState<StatusState>({ type: "idle", message: "Comece por etapa, componente e tema. O Planify sugere conteúdos inteligentes antes de gerar." });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [generatedMaterial, setGeneratedMaterial] = useState<GeneratedMaterial | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionOutput | null>(null);
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const manualConteudos = useMemo(() => splitLines(form.conteudos), [form.conteudos]);
  const selectedContents = useMemo(
    () => buildSelectedContentLines(suggestions?.conteudos || [], selectedSuggestionIds, form.conteudos),
    [form.conteudos, selectedSuggestionIds, suggestions],
  );
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
      if (key === "tipo" && value === "jogo") next.modeloJogo = next.modeloJogo || "cruzadinha";
      return next;
    });

    if (["etapa", "anoSerie", "areaConhecimento", "componenteCurricular", "tema"].includes(String(key))) {
      setSuggestions(null);
      setSelectedSuggestionIds([]);
    }
  }

  function clearAll() {
    setForm(initialForm);
    setGeneratedMaterial(null);
    setSuggestions(null);
    setSelectedSuggestionIds([]);
    setStatus({ type: "idle", message: "Campos limpos. Informe o tema e clique em Sugerir conteúdos inteligentes." });
  }

  function applyQuickExample(example: (typeof quickExamples)[number]) {
    setForm({
      ...initialForm,
      etapa: example.etapa,
      anoSerie: example.anoSerie,
      areaConhecimento: example.area,
      componenteCurricular: example.componente,
      tema: example.tema,
      tipo: "jogo",
      modeloJogo: example.jogo,
      titulo: `${gameLabels[example.jogo]} — ${example.tema}`,
    });
    setGeneratedMaterial(null);
    setSuggestions(null);
    setSelectedSuggestionIds([]);
    setStatus({ type: "info", message: "Exemplo aplicado. Agora clique em Sugerir conteúdos inteligentes." });
  }

  async function suggestContents() {
    if (!form.anoSerie) {
      setStatus({ type: "error", message: "Selecione o ano/série antes de sugerir conteúdos." });
      return;
    }
    if (isEnsinoMedio(form.etapa) && !form.areaConhecimento) {
      setStatus({ type: "error", message: "Selecione a área do conhecimento." });
      return;
    }
    if (!form.componenteCurricular) {
      setStatus({ type: "error", message: "Selecione o componente curricular." });
      return;
    }
    if (!form.tema.trim()) {
      setStatus({ type: "error", message: "Informe o tema central para o Planify sugerir conteúdos." });
      return;
    }

    setIsSuggesting(true);
    setStatus({ type: "info", message: "Analisando tema, etapa, série e componente para sugerir conteúdos compatíveis..." });

    try {
      const response = await fetch("/api/ai/material/sugerir-conteudos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          etapa: form.etapa,
          anoSerie: form.anoSerie,
          areaConhecimento: form.areaConhecimento,
          componenteCurricular: form.componenteCurricular,
          tema: form.tema,
          tipo: form.tipo,
          modeloJogo: form.modeloJogo,
          quantidade: 6,
          observacoes: form.observacoes,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error?.message || result?.message || "Não foi possível sugerir conteúdos agora.");
      }
      const data = result.data as SuggestionOutput;
      setSuggestions(data);
      setSelectedSuggestionIds([]);
      setStatus({ type: "success", message: "Conteúdos inteligentes sugeridos. Eles vêm desmarcados por padrão; escolha manualmente o que deseja usar." });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Não foi possível sugerir conteúdos agora." });
    } finally {
      setIsSuggesting(false);
    }
  }

  function toggleSuggestion(id: string) {
    setSelectedSuggestionIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function selectAllSuggestions() {
    if (!suggestions) return;
    setSelectedSuggestionIds((suggestions.conteudos || []).map((item) => item.id));
  }

  function clearSuggestionSelection() {
    setSelectedSuggestionIds([]);
  }

  function selectRecommendedSuggestions() {
    if (!suggestions) return;
    const ids = (suggestions.conteudos || [])
      .filter((item) => !String(item.dificuldade || "").toLocaleLowerCase("pt-BR").includes("avançado"))
      .slice(0, 5)
      .map((item) => item.id);
    setSelectedSuggestionIds(ids);
  }

  function applySelectedSuggestionsToField() {
    if (!suggestions) return;
    const lines = suggestions.conteudos
      .filter((item) => selectedSuggestionIds.includes(item.id))
      .map(contentLineFromSuggestion);
    setForm((current) => ({ ...current, conteudos: lines.join("\n"), objetivos: suggestions.objetivosGerais.join("\n") }));
    setStatus({ type: "success", message: "Conteúdos aprovados aplicados ao modo avançado. Agora você pode editar manualmente se quiser." });
  }

  function useRecommended(option: RecommendedOption) {
    const tipo = ["atividade", "prova", "lista", "revisao", "apostila", "sequencia", "jogo", "projeto", "roteiro"].includes(option.tipo)
      ? (option.tipo as MaterialType)
      : "jogo";
    const model = gameModelOptions.some((item) => item.value === option.modeloJogo) ? (option.modeloJogo as GameModel) : form.modeloJogo;
    setForm((current) => ({ ...current, tipo, modeloJogo: model || "cruzadinha" }));
    setStatus({ type: "info", message: `Formato aplicado: ${option.titulo}.` });
  }

  async function generateMaterial() {
    const conteudos = selectedContents;
    const validation = validateForm(form, conteudos);
    if (validation) {
      setStatus({ type: "error", message: validation });
      return;
    }

    setIsGenerating(true);
    setStatus({ type: "info", message: form.tipo === "jogo" ? `Gerando ${selectedGameModel?.label || "jogo"} com conteúdos aprovados...` : "Gerando material didático com IA..." });

    try {
      const response = await fetch("/api/ai/material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, conteudos, titulo: form.titulo || `${typeLabels[form.tipo]} — ${form.tema}` }),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error?.message || result?.message || "Não foi possível gerar material agora.");
      }
      const material = normalizeGeneratedMaterial((result.data || result.material) as GeneratedMaterial, form, conteudos);
      setGeneratedMaterial(material);
      saveToLocalHistory(material);
      setStatus({ type: "success", message: form.tipo === "jogo" ? "Jogo visual gerado com conteúdos coerentes, gabarito e versão editável." : "Material gerado com IA." });
    } catch (error) {
      const fallback = buildFallbackMaterial(form, conteudos);
      setGeneratedMaterial(fallback);
      saveToLocalHistory(fallback);
      setStatus({
        type: "success",
        message: error instanceof Error ? `A IA não respondeu agora. O construtor Planify gerou uma versão visual. Detalhe: ${error.message}` : "O construtor Planify gerou uma versão visual.",
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
    <section className="mx-auto grid max-w-7xl gap-6 px-5 py-10 lg:grid-cols-[0.7fr_1.3fr] sm:px-8">
      <aside className="space-y-6">
        <div className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-6 shadow-2xl shadow-cyan-500/10">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-300">Assistente pedagógico</p>
          <h1 className="mt-4 text-3xl font-black text-white">Materiais com IA</h1>
          <p className="mt-4 text-sm leading-7 text-cyan-100/80">
            Informe o tema central. O Planify sugere conteúdos, palavras-chave, objetivos e os melhores jogos antes de gerar o material.
          </p>

          <div className="mt-6 grid gap-3">
            {quickExamples.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() => applyQuickExample(example)}
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-left text-sm text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                <span className="block font-black text-cyan-100">Exemplo: {example.label}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-400">{example.tema}</span>
              </button>
            ))}
          </div>
        </div>

        {form.tipo === "jogo" && (
          <div className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-6 shadow-2xl shadow-emerald-500/10">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-200">Jogo visual</p>
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
              <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-300">Modo rápido inteligente</p>
              <h2 className="mt-3 text-3xl font-black text-white">Tema → conteúdos → material</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                Primeiro gere sugestões compatíveis com a turma. Depois aprove, ajuste e gere o material ou jogo.
              </p>
            </div>
            <button type="button" onClick={clearAll} className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10">
              Limpar tudo
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
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
              <span className="text-sm font-bold text-slate-300">Tipo de material</span>
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

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-bold text-slate-300">Tema central</span>
              <input value={form.tema} onChange={(event) => updateField("tema", event.target.value)} placeholder="Ex.: Jó e a fidelidade diante das provações" className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50" />
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={suggestContents} disabled={isSuggesting} className="rounded-2xl bg-cyan-200 px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60">
              {isSuggesting ? "Sugerindo..." : "Sugerir conteúdos inteligentes"}
            </button>
            <button type="button" onClick={() => setShowAdvanced((value) => !value)} className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10">
              {showAdvanced ? "Ocultar modo avançado" : "Modo avançado opcional"}
            </button>
          </div>

          {showAdvanced && (
            <div className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-slate-950/35 p-4 md:grid-cols-2">
              <label className="grid gap-2 md:col-span-2"><span className="text-sm font-bold text-slate-300">Título opcional</span><input value={form.titulo} onChange={(event) => updateField("titulo", event.target.value)} placeholder="Se deixar vazio, o Planify cria automaticamente" className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none placeholder:text-slate-500" /></label>
              <label className="grid gap-2"><span className="text-sm font-bold text-slate-300">Escola</span><input value={form.escola} onChange={(event) => updateField("escola", event.target.value)} placeholder="Nome da escola" className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none placeholder:text-slate-500" /></label>
              <label className="grid gap-2"><span className="text-sm font-bold text-slate-300">Professor</span><input value={form.professor} onChange={(event) => updateField("professor", event.target.value)} placeholder="Nome do professor" className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none placeholder:text-slate-500" /></label>
              {needsQuestionQuantity(form.tipo) && <label className="grid gap-2"><span className="text-sm font-bold text-slate-300">Quantidade de questões</span><input value={form.quantidadeQuestoes} onChange={(event) => updateField("quantidadeQuestoes", event.target.value)} placeholder="10" className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none placeholder:text-slate-500" /></label>}
              <label className="grid gap-2"><span className="text-sm font-bold text-slate-300">Duração</span><input value={form.duracao} onChange={(event) => updateField("duracao", event.target.value)} placeholder="Ex.: 1 período" className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none placeholder:text-slate-500" /></label>
              <label className="grid gap-2 md:col-span-2"><span className="text-sm font-bold text-slate-300">Conteúdos manuais</span><textarea value={form.conteudos} onChange={(event) => updateField("conteudos", event.target.value)} rows={5} placeholder={"Use somente se quiser substituir as sugestões.\nEx.: Jó na tradição bíblica: Jó, fé, provação"} className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm text-white outline-none placeholder:text-slate-500" /></label>
              <label className="grid gap-2 md:col-span-2"><span className="text-sm font-bold text-slate-300">Objetivos</span><textarea value={form.objetivos} onChange={(event) => updateField("objetivos", event.target.value)} rows={3} placeholder="Objetivos pedagógicos específicos" className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm text-white outline-none placeholder:text-slate-500" /></label>
              <label className="grid gap-2 md:col-span-2"><span className="text-sm font-bold text-slate-300">Orientações e observações</span><textarea value={form.observacoes} onChange={(event) => updateField("observacoes", event.target.value)} rows={3} placeholder="Características da turma, dificuldade, impressão, recortes ou adaptação" className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm text-white outline-none placeholder:text-slate-500" /></label>
            </div>
          )}
        </div>

        {suggestions && (
          <div className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-6 shadow-2xl shadow-emerald-500/10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-200">Conteúdos sugeridos</p>
                <h2 className="mt-3 text-2xl font-black text-white">Revise antes de gerar</h2>
                <p className="mt-3 text-sm leading-7 text-emerald-50/80">{suggestions.resumoPedagogico}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={selectRecommendedSuggestions} className="rounded-2xl border border-emerald-200/30 bg-white px-4 py-3 text-xs font-black text-slate-950 transition hover:-translate-y-1 hover:bg-emerald-50">
                  Selecionar recomendadas
                </button>
                <button type="button" onClick={selectAllSuggestions} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-black text-white transition hover:-translate-y-1 hover:bg-white/15">
                  Selecionar todas
                </button>
                <button type="button" onClick={clearSuggestionSelection} className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-xs font-black text-slate-200 transition hover:-translate-y-1 hover:bg-white/10">
                  Limpar seleção
                </button>
                <button type="button" onClick={applySelectedSuggestionsToField} className="rounded-2xl border border-emerald-200/30 bg-white px-4 py-3 text-xs font-black text-slate-950 transition hover:-translate-y-1 hover:bg-emerald-50">
                  Aplicar no modo avançado
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {suggestions.conteudos.map((item) => {
                const selected = selectedSuggestionIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleSuggestion(item.id)}
                    className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${selected ? "border-emerald-200/70 bg-white text-slate-950" : "border-white/10 bg-slate-950/45 text-white hover:bg-white/10"}`}
                  >
                    <span className="block text-xs font-black uppercase tracking-[0.18em] opacity-70">{selected ? "Selecionado" : "Clique para usar"} • {item.dificuldade} • {item.tempoEstimado}</span>
                    <span className="mt-2 block text-lg font-black">{item.titulo}</span>
                    <span className="mt-2 block text-sm leading-6 opacity-80">{item.descricao}</span>
                    <span className="mt-3 block text-xs font-bold opacity-70">Palavras-chave: {(item.palavrasChave || []).join(", ")}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">Jogos recomendados</p>
                <div className="mt-3 grid gap-2">
                  {suggestions.jogosRecomendados.slice(0, 4).map((option, index) => (
                    <button key={`${option.titulo}-${index}`} type="button" onClick={() => useRecommended(option)} className="rounded-xl border border-white/10 bg-white/5 p-3 text-left text-sm text-white transition hover:bg-white/10">
                      <strong>{option.titulo}</strong><br /><span className="text-slate-400">{option.motivo}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">Objetivos sugeridos</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                  {suggestions.objetivosGerais.slice(0, 5).map((objetivo) => <li key={objetivo}>• {objetivo}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={generateMaterial} disabled={isGenerating} className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60">
              {isGenerating ? "Gerando..." : form.tipo === "jogo" ? `Gerar ${selectedGameModel?.label || "jogo visual"}` : "Gerar material"}
            </button>
            <Link href="/historico" className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10">Ver histórico</Link>
          </div>
          <p className="mt-4 text-xs leading-6 text-slate-500">
            Conteúdos que serão usados: {selectedContents.length || manualConteudos.length || 0}. As sugestões vêm desmarcadas por padrão. Escolha conteúdos ou preencha o modo avançado.
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl">
          {generatedMaterial ? (
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">Prévia</p>
              <h2 className="mt-3 text-3xl font-black text-white">{generatedMaterial.titulo}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">{generatedMaterial.resumo || generatedMaterial.introducao}</p>

              {generatedMaterial.visualHtml || generatedMaterial.printHtml ? (
                <div className="mt-6 max-h-[780px] overflow-auto rounded-2xl border border-slate-200 bg-white p-5 text-slate-900" dangerouslySetInnerHTML={{ __html: generatedMaterial.visualHtml || generatedMaterial.printHtml || "" }} />
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
              <p className="mt-3 text-sm leading-7 text-slate-400">
                O resultado aparecerá aqui. Para jogos, a prévia deve mostrar grade, cartelas, cartas ou peças reais antes de abrir no Editor.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default MateriaisClient;
