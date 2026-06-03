"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase/browser-client";
import {
  MATERIAL_SIZE_OPTIONS,
  MATERIAL_TYPE_OPTIONS,
  getMaterialCreditCost,
  getMaterialTypeLabel,
  materialTypeNeedsQuestions,
  type MaterialGeneratorSize,
  type MaterialGeneratorType,
} from "../../config/material-credits";
import { downloadDocxDocument } from "../../lib/downloads/docx-download-client";
import { createEditorDocument, saveEditorDocument } from "../../lib/editor/editor-storage";
import type {
  MaterialGenerationResponse,
  MaterialGeneratorBNCCSkill,
  MaterialGeneratorQuestionType,
  PlanifyGeneratedMaterial,
} from "../../types/material-generator";

type FormState = {
  escola: string;
  professor: string;
  turma: string;
  tipoMaterial: MaterialGeneratorType;
  etapaEnsino: string;
  anoSerie: string;
  areaConhecimento: string;
  componenteCurricular: string;
  temaCentral: string;
  objetivo: string;
  tamanho: MaterialGeneratorSize;
  nivelDificuldade: string;
  quantidadeQuestoes: string;
  tiposQuestao: MaterialGeneratorQuestionType[];
  gerarGabarito: boolean;
  gerarVersaoProfessor: boolean;
  recursosDisponiveis: string;
  inclusaoAcessibilidade: string;
  tomLinguagem: string;
  observacoes: string;
  formatoJogo: string;
  organizacaoJogo: string;
  duracaoJogo: string;
  numeroParticipantes: string;
  materiaisJogo: string;
  regrasJogo: string;
  produtoFinalJogo: string;
  nivelMovimento: string;
};

type StatusState = {
  type: "idle" | "info" | "success" | "error";
  message: string;
};

type BnccSuggestion = MaterialGeneratorBNCCSkill & {
  id?: string;
  texto?: string;
  label?: string;
};

type GameProfile = {
  value: string;
  label: string;
  description: string;
  itemLabel: string;
  itemDefault: number;
  itemMin: number;
  organization: string;
  organizationOptions: string[];
  duration: string;
  durationOptions: string[];
  participants: string;
  materials: string;
  rules: string;
  product: string;
  movement: string;
  deliverables: string[];
};

const initialGameFormat = "caca_palavras";

const gameProfiles: GameProfile[] = [
  {
    value: "caca_palavras",
    label: "Caça-palavras",
    description: "Grade real de letras, lista de palavras, desafio pós-jogo e gabarito do professor.",
    itemLabel: "palavras",
    itemDefault: 16,
    itemMin: 10,
    organization: "individual",
    organizationOptions: ["individual", "duplas", "correcao_coletiva"],
    duration: "20 a 30 minutos",
    durationOptions: ["15 a 20 minutos", "20 a 30 minutos", "30 a 40 minutos"],
    participants: "Atividade individual ou em duplas, com correção coletiva ao final.",
    materials: "Folha impressa do caça-palavras, lápis, borracha e gabarito do professor.",
    rules: "Encontrar as palavras, circular cada termo e explicar três palavras no fechamento.",
    product: "Grade resolvida, palavras localizadas e síntese curta do conteúdo.",
    movement: "baixo",
    deliverables: ["Grade do aluno", "Banco de palavras", "Gabarito", "Atividade pós-jogo"],
  },
  {
    value: "cruzadinha",
    label: "Cruzadinha",
    description: "Grade da cruzadinha, pistas horizontais/verticais e gabarito preenchido.",
    itemLabel: "pistas e respostas",
    itemDefault: 14,
    itemMin: 8,
    organization: "individual",
    organizationOptions: ["individual", "duplas", "grupos"],
    duration: "25 a 40 minutos",
    durationOptions: ["20 a 30 minutos", "25 a 40 minutos", "40 a 50 minutos"],
    participants: "Estudantes resolvem individualmente ou em duplas; professor corrige por pistas.",
    materials: "Folha impressa da cruzadinha, lápis, borracha, quadro para correção e gabarito.",
    rules: "Ler as pistas, preencher a grade, justificar respostas difíceis e conferir no fechamento.",
    product: "Cruzadinha preenchida, pistas respondidas e gabarito para correção.",
    movement: "baixo",
    deliverables: ["Grade em branco", "Pistas", "Respostas", "Gabarito preenchido"],
  },
  {
    value: "bingo_pedagogico",
    label: "Bingo pedagógico",
    description: "Cartelas diferentes, lista de sorteio com conceitos e regras de vitória.",
    itemLabel: "termos/conceitos",
    itemDefault: 28,
    itemMin: 18,
    organization: "turma_inteira",
    organizationOptions: ["individual", "duplas", "turma_inteira"],
    duration: "30 a 45 minutos",
    durationOptions: ["20 a 30 minutos", "30 a 45 minutos", "45 a 50 minutos"],
    participants: "Cada estudante ou dupla recebe uma cartela; professor lê definições ou perguntas.",
    materials: "Cartelas impressas, lista de chamada do professor e marcadores.",
    rules: "Professor sorteia definições; estudantes marcam o conceito correspondente; vence quem completar linha, coluna ou cartela.",
    product: "Cartelas preenchidas, lista de sorteio e fechamento conceitual.",
    movement: "baixo",
    deliverables: ["Cartelas variadas", "Lista de sorteio", "Regras", "Gabarito"],
  },
  {
    value: "jogo_memoria",
    label: "Jogo da memória",
    description: "Cartas recortáveis com pares de termo e definição/exemplo.",
    itemLabel: "pares",
    itemDefault: 14,
    itemMin: 8,
    organization: "grupos",
    organizationOptions: ["duplas", "grupos", "estacoes"],
    duration: "25 a 40 minutos",
    durationOptions: ["20 a 30 minutos", "25 a 40 minutos", "40 a 50 minutos"],
    participants: "Duplas ou pequenos grupos jogam com cartas viradas para baixo.",
    materials: "Cartas recortáveis impressas, envelopes ou saquinhos para organizar os pares.",
    rules: "Virar duas cartas por rodada, formar pares corretos e explicar a relação antes de pontuar.",
    product: "Pares montados, gabarito e explicação oral dos conceitos.",
    movement: "baixo",
    deliverables: ["Cartas recortáveis", "Pares corretos", "Regras", "Gabarito"],
  },
  {
    value: "domino_pedagogico",
    label: "Dominó pedagógico",
    description: "Peças recortáveis para associação encadeada de conceitos, exemplos e definições.",
    itemLabel: "peças",
    itemDefault: 18,
    itemMin: 10,
    organization: "grupos",
    organizationOptions: ["duplas", "grupos", "estacoes"],
    duration: "30 a 45 minutos",
    durationOptions: ["25 a 35 minutos", "30 a 45 minutos", "45 a 50 minutos"],
    participants: "Grupos recebem peças e montam a sequência correta.",
    materials: "Peças impressas e recortáveis, mesa ou cartolina para montagem.",
    rules: "Cada peça precisa ser ligada ao conceito/resposta compatível; o grupo justifica a sequência.",
    product: "Sequência montada, peças associadas e gabarito de conferência.",
    movement: "baixo",
    deliverables: ["Peças recortáveis", "Sequência correta", "Regras", "Gabarito"],
  },
  {
    value: "trilha_tabuleiro",
    label: "Trilha ou tabuleiro",
    description: "Percurso com casas numeradas, desafios, cartas e pontuação.",
    itemLabel: "casas/desafios",
    itemDefault: 24,
    itemMin: 12,
    organization: "grupos",
    organizationOptions: ["grupos", "duplas", "turma_inteira"],
    duration: "40 a 50 minutos",
    durationOptions: ["30 a 40 minutos", "40 a 50 minutos", "2 aulas"],
    participants: "Grupos avançam no tabuleiro respondendo desafios por casa.",
    materials: "Tabuleiro impresso ou desenhado, dado, marcadores e cartas de desafio.",
    rules: "Avançar casas, responder desafios, ganhar bônus por justificativa e fazer síntese ao final.",
    product: "Tabuleiro aplicado, cartas respondidas e registro de pontuação.",
    movement: "medio",
    deliverables: ["Tabuleiro", "Cartas de desafio", "Pontuação", "Gabarito"],
  },
  {
    value: "cartas_desafio",
    label: "Cartas de desafio",
    description: "Baralho pedagógico com perguntas, desafios e respostas para mediação.",
    itemLabel: "cartas",
    itemDefault: 20,
    itemMin: 10,
    organization: "grupos",
    organizationOptions: ["duplas", "grupos", "estacoes"],
    duration: "25 a 40 minutos",
    durationOptions: ["20 a 30 minutos", "25 a 40 minutos", "40 a 50 minutos"],
    participants: "Grupos sorteiam cartas, discutem e respondem com justificativa.",
    materials: "Cartas impressas e recortáveis, folha de registro e gabarito.",
    rules: "Sorteie uma carta, responda, justifique e registre; professor valida com critérios.",
    product: "Cartas respondidas e folha de registro da aprendizagem.",
    movement: "medio",
    deliverables: ["Cartas recortáveis", "Folha de registro", "Critérios", "Gabarito"],
  },
  {
    value: "quiz_equipes",
    label: "Quiz em equipes",
    description: "Rodadas de perguntas, pontuação, desempate e gabarito comentado.",
    itemLabel: "perguntas",
    itemDefault: 18,
    itemMin: 10,
    organization: "grupos",
    organizationOptions: ["grupos", "turma_inteira"],
    duration: "30 a 45 minutos",
    durationOptions: ["20 a 30 minutos", "30 a 45 minutos", "45 a 50 minutos"],
    participants: "Equipes respondem por rodada com tempo controlado.",
    materials: "Lista de perguntas, quadro de pontuação e gabarito do professor.",
    rules: "Responder por rodada, justificar respostas abertas e usar desempate quando necessário.",
    product: "Pontuação final, respostas registradas e correção comentada.",
    movement: "medio",
    deliverables: ["Perguntas", "Rodadas", "Pontuação", "Gabarito comentado"],
  },
  {
    value: "escape_room_educativo",
    label: "Escape room educativo",
    description: "Missão com enigmas, pistas liberáveis, solução e fechamento pedagógico.",
    itemLabel: "enigmas",
    itemDefault: 8,
    itemMin: 5,
    organization: "grupos",
    organizationOptions: ["grupos", "estacoes"],
    duration: "1 aula",
    durationOptions: ["40 a 50 minutos", "1 aula", "2 aulas"],
    participants: "Grupos resolvem enigmas em sequência para completar a missão.",
    materials: "Cartões de enigma, pistas, envelopes e folha de solução.",
    rules: "Resolver enigmas em ordem, pedir pistas com custo de pontos e justificar a solução final.",
    product: "Missão resolvida, enigmas respondidos e síntese final.",
    movement: "medio",
    deliverables: ["Missão", "Enigmas", "Pistas", "Soluções"],
  },
  {
    value: "dinamica_cooperativa",
    label: "Dinâmica cooperativa",
    description: "Interação orientada com papéis, cooperação, produto final e avaliação.",
    itemLabel: "desafios",
    itemDefault: 10,
    itemMin: 6,
    organization: "grupos",
    organizationOptions: ["grupos", "turma_inteira", "estacoes"],
    duration: "30 a 45 minutos",
    durationOptions: ["20 a 30 minutos", "30 a 45 minutos", "45 a 50 minutos"],
    participants: "Turma organizada em grupos com papéis complementares.",
    materials: "Cartões de desafio, folha de registro e espaço para socialização.",
    rules: "Resolver em cooperação, registrar decisões e socializar a conclusão do grupo.",
    product: "Produto coletivo, registro e autoavaliação rápida.",
    movement: "medio",
    deliverables: ["Papéis", "Desafios", "Produto final", "Roteiro de mediação"],
  },
];

const organizationLabels: Record<string, string> = {
  individual: "Individual",
  duplas: "Duplas",
  grupos: "Grupos",
  turma_inteira: "Turma inteira",
  estacoes: "Estações de aprendizagem",
  correcao_coletiva: "Correção coletiva",
};

const movementOptions = [
  { value: "baixo", label: "Baixo movimento" },
  { value: "medio", label: "Movimento moderado" },
  { value: "alto", label: "Mais movimento" },
];

const etapaOptions = ["Educação Infantil", "Ensino Fundamental", "Ensino Médio", "EJA"];

const anoSerieByEtapa: Record<string, string[]> = {
  "Educação Infantil": ["Creche", "Pré-escola"],
  "Ensino Fundamental": ["1º ano", "2º ano", "3º ano", "4º ano", "5º ano", "6º ano", "7º ano", "8º ano", "9º ano"],
  "Ensino Médio": ["1ª série", "2ª série", "3ª série"],
  EJA: ["Alfabetização", "Anos iniciais", "Anos finais", "Ensino Médio"],
};

const areasEnsinoMedio = [
  "Linguagens e suas Tecnologias",
  "Matemática e suas Tecnologias",
  "Ciências da Natureza e suas Tecnologias",
  "Ciências Humanas e Sociais Aplicadas",
];

const componentesByEtapa: Record<string, string[]> = {
  "Educação Infantil": [
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
  "Ensino Médio": [
    "Língua Portuguesa",
    "Redação",
    "Escrita Criativa",
    "Arte",
    "Educação Física",
    "Língua Inglesa",
    "Língua Espanhola",
    "Matemática",
    "Biologia",
    "Física",
    "Química",
    "História",
    "Geografia",
    "Filosofia",
    "Sociologia",
  ],
  EJA: ["Língua Portuguesa", "Matemática", "Ciências", "História", "Geografia", "Arte", "Educação Física", "Língua Inglesa"],
};

const objetivoOptions = [
  { value: "ensinar", label: "Ensinar conteúdo novo" },
  { value: "revisar", label: "Revisar conteúdo" },
  { value: "avaliar", label: "Avaliar aprendizagem" },
  { value: "aprofundar", label: "Aprofundar o tema" },
  { value: "recuperar_aprendizagem", label: "Recuperar aprendizagem" },
];

const difficultyOptions = [
  { value: "basico", label: "Básico" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
];

const questionTypeOptions: Array<{ value: MaterialGeneratorQuestionType; label: string }> = [
  { value: "multipla_escolha", label: "Múltipla escolha" },
  { value: "discursiva", label: "Discursiva" },
  { value: "verdadeiro_falso", label: "Verdadeiro/Falso" },
  { value: "complete", label: "Complete" },
  { value: "associacao", label: "Associação" },
  { value: "analise_contextualizada", label: "Análise contextualizada" },
];

const generationMessages = [
  "Preparando uma estrutura limpa, editável e pronta para imprimir.",
  "Organizando versão do aluno, gabarito e orientações do professor.",
  "Ajustando o material ao tipo escolhido, sem misturar formatos.",
  "Montando o conteúdo com clareza pedagógica e boa apresentação.",
  "Finalizando o material para abrir no Editor, Word ou PDF.",
];

const initialForm: FormState = {
  escola: "",
  professor: "",
  turma: "",
  tipoMaterial: "apostila",
  etapaEnsino: "Ensino Fundamental",
  anoSerie: "7º ano",
  areaConhecimento: "",
  componenteCurricular: "Geografia",
  temaCentral: "",
  objetivo: "ensinar",
  tamanho: "medio",
  nivelDificuldade: "intermediario",
  quantidadeQuestoes: "12",
  tiposQuestao: ["discursiva", "multipla_escolha", "analise_contextualizada"],
  gerarGabarito: true,
  gerarVersaoProfessor: true,
  recursosDisponiveis: "Quadro, caderno, impressão e projetor quando disponível",
  inclusaoAcessibilidade: "Linguagem clara, instruções objetivas e apoio visual quando possível",
  tomLinguagem: "claro, profissional e adequado à turma",
  observacoes: "",
  formatoJogo: initialGameFormat,
  organizacaoJogo: "individual",
  duracaoJogo: "20 a 30 minutos",
  numeroParticipantes: "Atividade individual ou em duplas, com correção coletiva ao final.",
  materiaisJogo: "Folha impressa do caça-palavras, lápis, borracha e gabarito do professor.",
  regrasJogo: "Encontrar as palavras, circular cada termo e explicar três palavras no fechamento.",
  produtoFinalJogo: "Grade resolvida, palavras localizadas e síntese curta do conteúdo.",
  nivelMovimento: "baixo",
};

function fieldBase() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100";
}

function labelBase() {
  return "text-xs font-black uppercase tracking-[0.18em] text-slate-500";
}

function getGameProfile(format: string): GameProfile {
  return gameProfiles.find((item) => item.value === format) || gameProfiles[0];
}

function normalizeBnccSuggestion(item: BnccSuggestion): MaterialGeneratorBNCCSkill | null {
  const codigo = String(item.codigo || "").trim().toUpperCase();
  const descricao = String(item.descricao || item.texto || item.label || "").trim();

  if (!codigo || !descricao) return null;

  return {
    codigo,
    descricao,
    etapa: item.etapa,
    anoSerie: item.anoSerie,
    componente: item.componente,
    area: item.area,
    conteudo: item.conteudo,
  };
}

function sameSkill(a: MaterialGeneratorBNCCSkill, b: MaterialGeneratorBNCCSkill): boolean {
  return a.codigo === b.codigo && a.descricao === b.descricao;
}

function sanitizePreviewHtml(html: string): string {
  return String(html || "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

function materialTitle(material: PlanifyGeneratedMaterial | null): string {
  return material?.titulo || material?.metadata?.titulo || "Material didático Planify";
}

function materialSubtitle(material: PlanifyGeneratedMaterial | null): string {
  return material?.subtitulo || `${material?.metadata?.componenteCurricular || "Componente"} • ${material?.metadata?.anoSerie || "Ano/Série"}`;
}

async function buildJsonHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  try {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    // A API ainda tenta resolver sessão por cookies.
  }

  return headers;
}

function fallbackPreview(material: PlanifyGeneratedMaterial): string {
  return `<article><h1>${materialTitle(material)}</h1><p>${material.resumo || "Material gerado pelo Planify."}</p></article>`;
}

function createBrowserId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `material_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function MateriaisClient() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<StatusState>({ type: "idle", message: "" });
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [bnccLoading, setBnccLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [bnccSuggestions, setBnccSuggestions] = useState<MaterialGeneratorBNCCSkill[]>([]);
  const [selectedBncc, setSelectedBncc] = useState<MaterialGeneratorBNCCSkill[]>([]);
  const [material, setMaterial] = useState<PlanifyGeneratedMaterial | null>(null);
  const [creditMessage, setCreditMessage] = useState("");
  const [generationMessage, setGenerationMessage] = useState(generationMessages[0]);

  const isGameMaterial = form.tipoMaterial === "jogo";
  const gameProfile = getGameProfile(form.formatoJogo);
  const creditCost = useMemo(() => getMaterialCreditCost(form.tipoMaterial, form.tamanho), [form.tipoMaterial, form.tamanho]);
  const availableYears = anoSerieByEtapa[form.etapaEnsino] || anoSerieByEtapa["Ensino Fundamental"];
  const availableComponents = componentesByEtapa[form.etapaEnsino] || componentesByEtapa["Ensino Fundamental"];
  const normalMaterialOptions = MATERIAL_TYPE_OPTIONS.filter((option) => option.value !== "jogo");
  const needsQuestions = !isGameMaterial && materialTypeNeedsQuestions(form.tipoMaterial);
  const previewHtml = material ? sanitizePreviewHtml(material.htmlEditor || fallbackPreview(material)) : "";

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function applyGameProfile(current: FormState, format: string): FormState {
    const profile = getGameProfile(format);

    return {
      ...current,
      tipoMaterial: "jogo",
      formatoJogo: profile.value,
      objetivo: "revisar",
      quantidadeQuestoes: String(profile.itemDefault),
      organizacaoJogo: profile.organization,
      duracaoJogo: profile.duration,
      numeroParticipantes: profile.participants,
      materiaisJogo: profile.materials,
      regrasJogo: profile.rules,
      produtoFinalJogo: profile.product,
      nivelMovimento: profile.movement,
      gerarGabarito: true,
      gerarVersaoProfessor: true,
      recursosDisponiveis: "Materiais simples, imprimíveis e adequados ao formato do jogo.",
    };
  }

  function selectNormalMode() {
    setForm((current) => ({
      ...current,
      tipoMaterial: current.tipoMaterial === "jogo" ? "apostila" : current.tipoMaterial,
    }));
    setMaterial(null);
  }

  function selectGameMode() {
    setForm((current) => applyGameProfile(current, current.formatoJogo || initialGameFormat));
    setMaterial(null);
  }

  function updateGameFormat(format: string) {
    setForm((current) => applyGameProfile(current, format));
    setMaterial(null);
  }

  function updateEtapa(value: string) {
    const nextYears = anoSerieByEtapa[value] || anoSerieByEtapa["Ensino Fundamental"];
    const nextComponents = componentesByEtapa[value] || componentesByEtapa["Ensino Fundamental"];

    setForm((current) => ({
      ...current,
      etapaEnsino: value,
      anoSerie: nextYears[0] || current.anoSerie,
      areaConhecimento: value === "Ensino Médio" ? current.areaConhecimento || areasEnsinoMedio[0] : "",
      componenteCurricular: nextComponents[0] || current.componenteCurricular,
    }));
    setBnccSuggestions([]);
    setSelectedBncc([]);
    setMaterial(null);
  }

  function toggleQuestionType(value: MaterialGeneratorQuestionType) {
    setForm((current) => {
      const exists = current.tiposQuestao.includes(value);
      const next = exists ? current.tiposQuestao.filter((item) => item !== value) : [...current.tiposQuestao, value];
      return { ...current, tiposQuestao: next.length ? next : current.tiposQuestao };
    });
  }

  function toggleBncc(skill: MaterialGeneratorBNCCSkill) {
    setSelectedBncc((current) => {
      const exists = current.some((item) => sameSkill(item, skill));
      return exists ? current.filter((item) => !sameSkill(item, skill)) : [...current, skill];
    });
  }

  function validateForm(): string | null {
    if (!form.etapaEnsino) return "Selecione a etapa.";
    if (!form.anoSerie) return "Selecione o ano/série.";
    if (!form.componenteCurricular) return "Selecione o componente curricular.";
    if (!form.temaCentral.trim()) return "Informe o tema central.";
    if (isGameMaterial && !form.formatoJogo) return "Selecione o formato do jogo.";
    if (isGameMaterial && Number(form.quantidadeQuestoes) < gameProfile.itemMin) return `Use pelo menos ${gameProfile.itemMin} ${gameProfile.itemLabel}.`;
    if (needsQuestions && !form.quantidadeQuestoes.trim()) return "Informe a quantidade de questões.";
    return null;
  }

  async function suggestBncc() {
    const error = validateForm();
    if (error) {
      setStatus({ type: "error", message: error });
      return;
    }

    setBnccLoading(true);
    setStatus({ type: "info", message: "Buscando habilidades compatíveis. Elas virão desmarcadas para o professor escolher." });

    try {
      const response = await fetch("/api/bncc/sugerir", {
        method: "POST",
        headers: await buildJsonHeaders(),
        body: JSON.stringify({
          etapa: form.etapaEnsino,
          anoSerie: form.anoSerie,
          areaConhecimento: form.areaConhecimento,
          componenteCurricular: form.componenteCurricular,
          conteudos: [form.temaCentral],
          tema: form.temaCentral,
        }),
      });

      const json = await response.json();
      if (!response.ok || json.success === false) throw new Error(json?.error?.message || "Não foi possível sugerir BNCC.");

      const rawItems = (json.habilidades || json.sugeridas || json.skills || json.items || []) as BnccSuggestion[];
      const unique = rawItems
        .map(normalizeBnccSuggestion)
        .filter((item): item is MaterialGeneratorBNCCSkill => Boolean(item))
        .filter((item, index, array) => array.findIndex((other) => sameSkill(other, item)) === index);

      setBnccSuggestions(unique);
      setSelectedBncc([]);
      setStatus({
        type: unique.length ? "success" : "info",
        message: unique.length
          ? `${unique.length} habilidade(s) encontrada(s). Clique nos cards para selecionar as que deseja usar.`
          : "Nenhuma habilidade encontrada. O material será gerado sem inventar BNCC.",
      });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Erro ao sugerir BNCC." });
    } finally {
      setBnccLoading(false);
    }
  }

  async function generateMaterial() {
    const error = validateForm();
    if (error) {
      setStatus({ type: "error", message: error });
      return;
    }

    const message = generationMessages[Math.floor(Math.random() * generationMessages.length)] || generationMessages[0];
    setGenerationMessage(message);
    setGenerating(true);
    setMaterial(null);
    setCreditMessage("");
    setStatus({ type: "info", message: "Gerando material. Aguarde a finalização antes de sair da página." });

    try {
      const response = await fetch("/api/materiais/gerar", {
        method: "POST",
        headers: await buildJsonHeaders(),
        body: JSON.stringify({
          ...form,
          quantidadeQuestoes: Number(form.quantidadeQuestoes) || 0,
          habilidadesBncc: selectedBncc,
          jogoDinamica: isGameMaterial
            ? {
                formato: form.formatoJogo,
                organizacao: form.organizacaoJogo,
                duracao: form.duracaoJogo,
                participantes: form.numeroParticipantes,
                materiais: form.materiaisJogo,
                regrasDesejadas: form.regrasJogo,
                produtoFinal: form.produtoFinalJogo,
                nivelMovimento: form.nivelMovimento,
                quantidadeItens: Number(form.quantidadeQuestoes) || gameProfile.itemDefault,
                gerarVersaoImpressao: true,
              }
            : null,
          idempotencyKey: createBrowserId(),
        }),
      });

      const json = (await response.json().catch(() => null)) as
        | MaterialGenerationResponse
        | { success: false; error?: { code?: string; message?: string; details?: string } }
        | null;

      if (!response.ok || !json || !json.success) {
        const errorPayload = json && !json.success ? json.error : null;
        throw new Error(errorPayload?.message || "Não foi possível gerar o material.");
      }

      setMaterial(json.data.material);
      setCreditMessage(json.data.credit.message);
      setStatus({
        type: "success",
        message: json.data.duplicate
          ? "Material recuperado sem consumir créditos duplicados."
          : "Material gerado com sucesso. Abra no Editor, baixe Word ou imprima em PDF.",
      });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Erro ao gerar material." });
    } finally {
      setGenerating(false);
    }
  }

  function openInEditor() {
    if (!material) return;
    const content = material.htmlEditor || fallbackPreview(material);
    const document = createEditorDocument({
      source: "material",
      title: materialTitle(material),
      subtitle: materialSubtitle(material),
      type: material.tipo || form.tipoMaterial,
      content,
      raw: material,
    });

    saveEditorDocument(document);
    window.location.assign("/editor");
  }

  async function downloadWord() {
    if (!material) return;
    await downloadDocxDocument("material", material, materialTitle(material));
  }

  function printPdf() {
    if (!material) return;
    const html = material.htmlEditor || fallbackPreview(material);
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) return;

    win.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" /><title>${materialTitle(material)}</title><style>@page{size:A4;margin:1.3cm;}body{font-family:Arial,sans-serif;color:#0f172a;}table{max-width:100%;} .page-break{page-break-after:always;break-after:page;}</style></head><body>${html}<script>window.onload=function(){setTimeout(function(){window.print()},250)}</script></body></html>`);
    win.document.close();
  }

  function clearAll() {
    setForm(initialForm);
    setStatus({ type: "idle", message: "" });
    setAdvancedOpen(false);
    setBnccSuggestions([]);
    setSelectedBncc([]);
    setMaterial(null);
    setCreditMessage("");
  }

  return (
    <main className="space-y-8 text-slate-950">
      {generating ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-md rounded-[1.75rem] border border-cyan-100 bg-white p-6 text-center shadow-2xl shadow-slate-950/30">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-2xl">✨</div>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Gerando material</p>
            <h2 className="mt-2 text-xl font-black text-slate-950">Aguarde um instante</h2>
            <p className="mt-3 text-sm font-bold leading-6 text-slate-600">{generationMessage}</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-cyan-500" />
            </div>
          </div>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[2rem] border border-cyan-200 bg-gradient-to-br from-slate-950 via-cyan-900 to-blue-950 p-6 text-white shadow-2xl shadow-cyan-950/20 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-100">Gerador IA de Materiais Didáticos</p>
            <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-tight md:text-5xl">Materiais prontos, editáveis e com estrutura de verdade.</h1>
            <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-cyan-50 md:text-base">
              Selecione material comum ou jogo pedagógico. A tela muda conforme a escolha, evitando campos incompatíveis e entregando um produto claro para editor, Word e PDF.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 shadow-xl backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100">Custo estimado</p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div><p className="text-4xl font-black">{creditCost}</p><p className="text-sm font-bold text-cyan-100">créditos</p></div>
              <div className="rounded-2xl bg-white px-4 py-3 text-right text-slate-950">
                <p className="text-xs font-black uppercase text-slate-500">Entrega</p>
                <p className="text-sm font-black">{isGameMaterial ? gameProfile.label : getMaterialTypeLabel(form.tipoMaterial)}</p>
              </div>
            </div>
            {creditMessage ? <p className="mt-3 text-xs font-bold text-cyan-50">{creditMessage}</p> : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/5 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={labelBase()}>Formulário inteligente</p>
              <h2 className="mt-1 text-2xl font-black">Configuração do material</h2>
            </div>
            <button type="button" onClick={clearAll} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700">Limpar tudo</button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={selectNormalMode} className={`rounded-[1.4rem] border p-5 text-left transition ${!isGameMaterial ? "border-cyan-400 bg-cyan-50 shadow-lg shadow-cyan-500/10" : "border-slate-200 bg-white hover:border-cyan-200"}`}>
              <p className="text-sm font-black text-slate-950">Material didático</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">Apostila, prova, atividade, resumo, lista, projeto e sequência.</p>
            </button>
            <button type="button" onClick={selectGameMode} className={`rounded-[1.4rem] border p-5 text-left transition ${isGameMaterial ? "border-emerald-400 bg-emerald-50 shadow-lg shadow-emerald-500/10" : "border-slate-200 bg-white hover:border-emerald-200"}`}>
              <p className="text-sm font-black text-slate-950">Jogos e dinâmicas</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">Caça-palavras, cruzadinha, bingo, memória, dominó e mais.</p>
            </button>
          </div>

          {!isGameMaterial ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <p className={labelBase()}>Tipo de material</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {normalMaterialOptions.map((option) => {
                  const selected = form.tipoMaterial === option.value;
                  return (
                    <button key={option.value} type="button" onClick={() => update("tipoMaterial", option.value as MaterialGeneratorType)} className={`rounded-2xl border p-4 text-left transition ${selected ? "border-cyan-400 bg-white shadow-md shadow-cyan-500/10" : "border-slate-200 bg-white/70 hover:border-cyan-200"}`}>
                      <span className="text-sm font-black text-slate-950">{option.label}</span>
                      <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${selected ? "bg-cyan-100 text-cyan-800" : "bg-slate-100 text-slate-500"}`}>{selected ? "Selecionado" : "Escolher"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4">
              <p className={labelBase()}>Formato do jogo</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {gameProfiles.map((profile) => {
                  const selected = form.formatoJogo === profile.value;
                  return (
                    <button key={profile.value} type="button" onClick={() => updateGameFormat(profile.value)} className={`rounded-2xl border p-4 text-left transition ${selected ? "border-emerald-500 bg-white shadow-md shadow-emerald-500/10" : "border-emerald-100 bg-white/80 hover:border-emerald-300"}`}>
                      <span className="text-sm font-black text-slate-950">{profile.label}</span>
                      <span className="mt-1 block text-xs font-bold leading-5 text-slate-500">{profile.description}</span>
                      <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black ${selected ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>{selected ? "Selecionado" : "Escolher"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2"><span className={labelBase()}>Etapa</span><select className={fieldBase()} value={form.etapaEnsino} onChange={(event) => updateEtapa(event.target.value)}>{etapaOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label className="space-y-2"><span className={labelBase()}>Ano/Série</span><select className={fieldBase()} value={form.anoSerie} onChange={(event) => update("anoSerie", event.target.value)}>{availableYears.map((option) => <option key={option}>{option}</option>)}</select></label>
            {form.etapaEnsino === "Ensino Médio" ? <label className="space-y-2 md:col-span-2"><span className={labelBase()}>Área do conhecimento</span><select className={fieldBase()} value={form.areaConhecimento} onChange={(event) => update("areaConhecimento", event.target.value)}>{areasEnsinoMedio.map((option) => <option key={option}>{option}</option>)}</select></label> : null}
            <label className="space-y-2 md:col-span-2"><span className={labelBase()}>Componente curricular</span><select className={fieldBase()} value={form.componenteCurricular} onChange={(event) => update("componenteCurricular", event.target.value)}>{availableComponents.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label className="space-y-2 md:col-span-2"><span className={labelBase()}>Tema central</span><input className={fieldBase()} value={form.temaCentral} onChange={(event) => update("temaCentral", event.target.value)} placeholder="Ex.: Amazônia, frações, Revolução Industrial..." /></label>
            <label className="space-y-2"><span className={labelBase()}>Objetivo</span><select className={fieldBase()} value={form.objetivo} onChange={(event) => update("objetivo", event.target.value)}>{objetivoOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="space-y-2"><span className={labelBase()}>Tamanho</span><select className={fieldBase()} value={form.tamanho} onChange={(event) => update("tamanho", event.target.value as MaterialGeneratorSize)}>{MATERIAL_SIZE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="space-y-2"><span className={labelBase()}>Dificuldade</span><select className={fieldBase()} value={form.nivelDificuldade} onChange={(event) => update("nivelDificuldade", event.target.value)}>{difficultyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            {!isGameMaterial && needsQuestions ? <label className="space-y-2"><span className={labelBase()}>Quantidade de questões</span><input className={fieldBase()} type="number" min={1} max={60} value={form.quantidadeQuestoes} onChange={(event) => update("quantidadeQuestoes", event.target.value)} /></label> : null}
          </div>

          {isGameMaterial ? (
            <div className="rounded-[1.5rem] border border-emerald-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div><p className={labelBase()}>Configuração compatível</p><h3 className="mt-1 text-xl font-black text-slate-950">{gameProfile.label}</h3><p className="mt-2 text-sm font-bold leading-6 text-slate-600">{gameProfile.description}</p></div>
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">{form.quantidadeQuestoes} {gameProfile.itemLabel}</div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">{gameProfile.deliverables.map((item) => <div key={item} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">✓ {item}</div>)}</div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="space-y-2"><span className={labelBase()}>Quantidade de {gameProfile.itemLabel}</span><input className={fieldBase()} type="number" min={gameProfile.itemMin} max={60} value={form.quantidadeQuestoes} onChange={(event) => update("quantidadeQuestoes", event.target.value)} /><p className="text-xs font-bold text-slate-500">Mínimo recomendado: {gameProfile.itemMin}.</p></label>
                <label className="space-y-2"><span className={labelBase()}>Duração</span><select className={fieldBase()} value={form.duracaoJogo} onChange={(event) => update("duracaoJogo", event.target.value)}>{gameProfile.durationOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
                <label className="space-y-2"><span className={labelBase()}>Organização</span><select className={fieldBase()} value={form.organizacaoJogo} onChange={(event) => update("organizacaoJogo", event.target.value)}>{gameProfile.organizationOptions.map((option) => <option key={option} value={option}>{organizationLabels[option] || option}</option>)}</select></label>
                <label className="space-y-2"><span className={labelBase()}>Movimento</span><select className={fieldBase()} value={form.nivelMovimento} onChange={(event) => update("nivelMovimento", event.target.value)}>{movementOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                <label className="space-y-2 md:col-span-2"><span className={labelBase()}>Participantes</span><input className={fieldBase()} value={form.numeroParticipantes} onChange={(event) => update("numeroParticipantes", event.target.value)} /></label>
                <label className="space-y-2 md:col-span-2"><span className={labelBase()}>Materiais do jogo</span><input className={fieldBase()} value={form.materiaisJogo} onChange={(event) => update("materiaisJogo", event.target.value)} /></label>
                <label className="space-y-2 md:col-span-2"><span className={labelBase()}>Regras do jogo</span><textarea className={`${fieldBase()} min-h-24`} value={form.regrasJogo} onChange={(event) => update("regrasJogo", event.target.value)} /></label>
                <label className="space-y-2 md:col-span-2"><span className={labelBase()}>Produto final</span><input className={fieldBase()} value={form.produtoFinalJogo} onChange={(event) => update("produtoFinalJogo", event.target.value)} /></label>
              </div>
            </div>
          ) : null}

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
            <button type="button" onClick={() => setAdvancedOpen((value) => !value)} className="flex w-full items-center justify-between gap-4 text-left">
              <span><span className={labelBase()}>Campos avançados</span><strong className="mt-1 block text-lg font-black">BNCC, gabarito, acessibilidade e recursos</strong></span>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-slate-700 shadow-sm">{advancedOpen ? "Fechar" : "Abrir"}</span>
            </button>
            {advancedOpen ? (
              <div className="mt-5 space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="space-y-2"><span className={labelBase()}>Escola</span><input className={fieldBase()} value={form.escola} onChange={(event) => update("escola", event.target.value)} /></label>
                  <label className="space-y-2"><span className={labelBase()}>Professor</span><input className={fieldBase()} value={form.professor} onChange={(event) => update("professor", event.target.value)} /></label>
                  <label className="space-y-2"><span className={labelBase()}>Turma</span><input className={fieldBase()} value={form.turma} onChange={(event) => update("turma", event.target.value)} /></label>
                </div>
                {!isGameMaterial ? <div><span className={labelBase()}>Tipos de questão</span><div className="mt-2 flex flex-wrap gap-2">{questionTypeOptions.map((option) => { const selected = form.tiposQuestao.includes(option.value); return <button key={option.value} type="button" onClick={() => toggleQuestionType(option.value)} className={`rounded-full border px-3 py-2 text-xs font-black transition ${selected ? "border-cyan-500 bg-cyan-50 text-cyan-800" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200"}`}>{selected ? "✓ " : "+ "}{option.label}</button>; })}</div></div> : <div className="rounded-2xl border border-emerald-200 bg-white p-4 text-sm font-bold leading-6 text-emerald-800">Jogos usam campos próprios e entregam versão do aluno, gabarito e formato imprimível.</div>}
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4"><span><span className="block text-sm font-black">Gerar gabarito</span><span className="text-xs font-semibold text-slate-500">Separado da versão do aluno.</span></span><input type="checkbox" checked={form.gerarGabarito} onChange={(event) => update("gerarGabarito", event.target.checked)} /></label>
                  <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4"><span><span className="block text-sm font-black">Versão do professor</span><span className="text-xs font-semibold text-slate-500">Com critérios e sugestões.</span></span><input type="checkbox" checked={form.gerarVersaoProfessor} onChange={(event) => update("gerarVersaoProfessor", event.target.checked)} /></label>
                </div>
                <label className="space-y-2"><span className={labelBase()}>Recursos disponíveis</span><input className={fieldBase()} value={form.recursosDisponiveis} onChange={(event) => update("recursosDisponiveis", event.target.value)} /></label>
                <label className="space-y-2"><span className={labelBase()}>Inclusão e acessibilidade</span><input className={fieldBase()} value={form.inclusaoAcessibilidade} onChange={(event) => update("inclusaoAcessibilidade", event.target.value)} /></label>
                <label className="space-y-2"><span className={labelBase()}>Observações do professor</span><textarea className={`${fieldBase()} min-h-24`} value={form.observacoes} onChange={(event) => update("observacoes", event.target.value)} placeholder="Ex.: turma com dificuldade de leitura, material para recuperação, evitar grupos grandes..." /></label>
              </div>
            ) : null}
          </div>

          <div className="rounded-[1.5rem] border border-cyan-100 bg-cyan-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><p className={labelBase()}>BNCC oficial</p><h3 className="text-lg font-black">Habilidades selecionáveis</h3><p className="mt-1 text-sm font-semibold text-slate-600">Nenhuma habilidade vem marcada automaticamente. O professor escolhe clicando.</p></div>
              <button type="button" onClick={suggestBncc} disabled={bnccLoading || generating} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/20 transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60">{bnccLoading ? "Buscando..." : "Sugerir BNCC"}</button>
            </div>
            {bnccSuggestions.length ? <div className="mt-4 grid gap-3">{bnccSuggestions.map((skill) => { const selected = selectedBncc.some((item) => sameSkill(item, skill)); return <button key={`${skill.codigo}-${skill.descricao}`} type="button" onClick={() => toggleBncc(skill)} className={`rounded-2xl border p-4 text-left transition ${selected ? "border-cyan-400 bg-white shadow-md shadow-cyan-500/10" : "border-slate-200 bg-white/70 hover:border-cyan-200"}`}><div className="flex items-start justify-between gap-4"><div><span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">{skill.codigo}</span><p className="mt-3 text-sm font-bold leading-6 text-slate-800">{skill.descricao}</p></div><span className={`rounded-full px-3 py-1 text-xs font-black ${selected ? "bg-cyan-100 text-cyan-800" : "bg-slate-100 text-slate-500"}`}>{selected ? "Selecionada" : "Selecionar"}</span></div></button>; })}</div> : null}
          </div>

          {status.type !== "idle" ? <div className={`rounded-2xl border p-4 text-sm font-bold leading-6 ${status.type === "error" ? "border-red-200 bg-red-50 text-red-700" : status.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-blue-200 bg-blue-50 text-blue-800"}`}>{status.message}</div> : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={generateMaterial} disabled={generating || bnccLoading} className="flex-1 rounded-2xl bg-gradient-to-r from-cyan-600 to-emerald-600 px-5 py-4 text-sm font-black text-white shadow-xl shadow-cyan-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60">{generating ? "Gerando..." : `Gerar material • ${creditCost} créditos`}</button>
            <Link href="/dashboard" className="rounded-2xl border border-slate-200 px-5 py-4 text-center text-sm font-black text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50">Voltar</Link>
          </div>
        </div>

        <div className="space-y-6">
          {material ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/5 md:p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div><p className={labelBase()}>Material gerado</p><h2 className="mt-2 text-2xl font-black">{materialTitle(material)}</h2><p className="mt-2 text-sm font-bold text-slate-500">{materialSubtitle(material)}</p></div>
                <div className="flex flex-wrap gap-2"><button type="button" onClick={openInEditor} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-cyan-800">Abrir no Editor</button><button type="button" onClick={downloadWord} className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-black text-cyan-800 transition hover:bg-cyan-100">Baixar Word</button><button type="button" onClick={printPdf} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">PDF/Imprimir</button></div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-4"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">Tipo</p><p className="mt-1 font-black">{material.tipo}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">Itens</p><p className="mt-1 font-black">{isGameMaterial ? form.quantidadeQuestoes : material.questoes?.length || 0}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">BNCC</p><p className="mt-1 font-black">{material.metadata.bncc?.length || 0}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">Créditos</p><p className="mt-1 font-black">{material.metadata.creditCost || creditCost}</p></div></div>
              <div className="mt-6 overflow-x-auto rounded-[1.5rem] border border-slate-200 bg-white p-5 text-slate-900 shadow-inner"><div dangerouslySetInnerHTML={{ __html: previewHtml }} /></div>
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center shadow-xl shadow-slate-950/5"><p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Prévia</p><h2 className="mt-3 text-2xl font-black">Seu material aparecerá aqui</h2><p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-7 text-slate-500">A tela agora separa materiais comuns de jogos. Ao escolher jogos, os campos normais somem e aparecem apenas opções compatíveis com o formato escolhido.</p></div>
          )}
        </div>
      </section>
    </main>
  );
}
