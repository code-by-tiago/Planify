"use client";

import { DailyGenerationsBar } from "@/components/credits/DailyGenerationsBar";
import { MaterialQualityScoreBar } from "@/components/materiais/MaterialQualityScoreBar";
import { PLANNING_DEEP_GENERATION_TYPE } from "@/lib/ai/material-generation-policy";
import { MarketplacePublishButton } from "@/components/marketplace/MarketplacePublishButton";
import { PlanifyOwlGenerationCoach } from "@/components/pro/PlanifyOwlGenerationCoach";
import { PlanifyWorkspacePane } from "@/components/pro/PlanifyWorkspacePane";
import { useSchoolClasses } from "@/hooks/useSchoolClasses";
import { TurmaSelect } from "@/components/school/TurmaSelect";
import { PlanifyPageHero } from "@/components/pro/PlanifyPageHero";
import { usePlanifyWorkspace } from "@/components/pro/planify-workspace-context";
import { HUD_FIELD_CLASS, HUD_TEXTAREA_CLASS } from "@/lib/pro/hud-form-styles";
import type { LumiCoachContext } from "@/lib/pro/lumiMotivationalMessages";
import {
  openPlanningInEditor,
  persistPlanningInEditor,
  readAutoOpenPlanningEditorPreference,
  writeAutoOpenPlanningEditorPreference,
  type PlanningEditorMeta,
} from "@/lib/planejamentos/planning-editor-flow";
import {
  buildElevatePlanningPayload,
  requestPlanningGeneration,
} from "@/lib/planejamentos/elevate-planning-client";
import { buildPlanningEditorHtml } from "@/lib/planejamentos/planning-editor-html";
import type { PlanningAiPayload } from "@/server/planejamentos/planning-ai-service";
import { readPlanejamentoPrefill } from "@/lib/planejamentos/planejamento-prefill";
import { downloadPlanejamentoOficialDocx } from "@/lib/planejamentos/download-planejamento-oficial";
import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import {
  readDownloadBlob,
  triggerBrowserDownload,
} from "@/lib/downloads/trigger-browser-download";
import { useEffect, useMemo, useState } from "react";

type TipoPlanejamento = "anual" | "trimestral";
type DocxDownloadMode = "anual" | "trimestral";

type BnccSkill = {
  id: string;
  codigo: string;
  descricao: string;
  texto?: string;
  label?: string;
  etapa?: string;
  anoSerie?: string;
  area?: string;
  componente?: string;
  conteudo: string;
  source?: "local" | "fallback";
};

type BnccGroup = {
  conteudo: string;
  habilidades: BnccSkill[];
};

type PlanningMatrixItem = {
  conteudo: string;
  trimestre: number;
  aulaInicio: number;
  aulaFim: number;
  habilidades: Array<{ codigo: string; descricao: string; conteudo?: string }>;
  objetivos: string;
  metodologia: string;
  recursos: string;
  avaliacao: string;
  evidencias: string;
};

type GeneratedPlanning = {
  tipoPlanejamento: string;
  titulo: string;
  resumo: string;
  conteudos: PlanningMatrixItem[];
};

type FormState = {
  escola: string;
  professor: string;
  etapa: string;
  anoSerie: string;
  areaConhecimento: string;
  componenteCurricular: string;
  cargaHoraria: string;
  tipoPlanejamento: TipoPlanejamento;
  trimestre: string;
  conteudos: string;
  objetivos: string;
  observacoes: string;
};

const initialForm: FormState = {
  escola: "",
  professor: "",
  etapa: "Ensino Médio",
  anoSerie: "3ª série",
  areaConhecimento: "Linguagens e suas Tecnologias",
  componenteCurricular: "Língua Portuguesa",
  cargaHoraria: "80 períodos",
  tipoPlanejamento: "anual",
  trimestre: "1",
  conteudos: "",
  objetivos: "",
  observacoes: "",
};

const EDUCATION_OPTIONS = {
  "Educação Infantil": {
    years: ["Berçário", "Maternal I", "Maternal II", "Pré I", "Pré II"],
    areas: ["Campos de experiências"],
    componentsByArea: {
      "Campos de experiências": [
        "O eu, o outro e o nós",
        "Corpo, gestos e movimentos",
        "Traços, sons, cores e formas",
        "Escuta, fala, pensamento e imaginação",
        "Espaços, tempos, quantidades, relações e transformações",
      ],
    },
  },
  "Ensino Fundamental": {
    years: ["1º ano", "2º ano", "3º ano", "4º ano", "5º ano", "6º ano", "7º ano", "8º ano", "9º ano"],
    areas: ["Linguagens", "Matemática", "Ciências da Natureza", "Ciências Humanas", "Ensino Religioso"],
    componentsByArea: {
      Linguagens: ["Língua Portuguesa", "Redação", "Escrita Criativa", "Arte", "Educação Física", "Língua Inglesa", "Língua Espanhola"],
      Matemática: ["Matemática"],
      "Ciências da Natureza": ["Ciências"],
      "Ciências Humanas": ["História", "Geografia"],
      "Ensino Religioso": ["Ensino Religioso"],
    },
  },
  "Ensino Médio": {
    years: ["1ª série", "2ª série", "3ª série"],
    areas: [
      "Linguagens e suas Tecnologias",
      "Matemática e suas Tecnologias",
      "Ciências da Natureza e suas Tecnologias",
      "Ciências Humanas e Sociais Aplicadas",
    ],
    componentsByArea: {
      "Linguagens e suas Tecnologias": [
        "Língua Portuguesa",
        "Redação",
        "Escrita Criativa",
        "Arte",
        "Educação Física",
        "Língua Inglesa",
        "Língua Espanhola",
      ],
      "Matemática e suas Tecnologias": ["Matemática"],
      "Ciências da Natureza e suas Tecnologias": ["Biologia", "Física", "Química"],
      "Ciências Humanas e Sociais Aplicadas": ["História", "Geografia", "Filosofia", "Sociologia"],
    },
  },
} as const;

type EducationStage = keyof typeof EDUCATION_OPTIONS;

function isEducationStage(value: string): value is EducationStage {
  return value in EDUCATION_OPTIONS;
}

function getEducationConfig(stage: string) {
  return EDUCATION_OPTIONS[isEducationStage(stage) ? stage : "Ensino Médio"];
}

function getAreaOptions(stage: string) {
  return [...getEducationConfig(stage).areas];
}

function getYearOptions(stage: string) {
  return [...getEducationConfig(stage).years];
}

function getComponentOptions(stage: string, area: string) {
  const config = getEducationConfig(stage);
  const selectedArea = config.areas.includes(area as never) ? area : config.areas[0];
  const options = config.componentsByArea[selectedArea as keyof typeof config.componentsByArea];

  return options ? [...options] : Object.values(config.componentsByArea).flat();
}

function normalizeEducationalFields(current: FormState, patch: Partial<FormState>) {
  const next: FormState = { ...current, ...patch };
  const config = getEducationConfig(next.etapa);

  if (!config.years.includes(next.anoSerie as never)) {
    next.anoSerie = config.years[0];
  }

  if (!config.areas.includes(next.areaConhecimento as never)) {
    next.areaConhecimento = config.areas[0];
  }

  const components = getComponentOptions(next.etapa, next.areaConhecimento);

  if (!components.includes(next.componenteCurricular)) {
    next.componenteCurricular = components[0] || "";
  }

  return next;
}

const exemplos = {
  fundamental: {
    etapa: "Ensino Fundamental",
    anoSerie: "5º ano",
    areaConhecimento: "Ciências Humanas",
    componenteCurricular: "História",
    cargaHoraria: "60 períodos",
    conteudos:
      "Povos originários do Brasil\nChegada dos portugueses e primeiros contatos\nColonização e organização do território\nCultura, memória e diversidade",
    objetivos:
      "Compreender processos históricos, reconhecer diferentes grupos sociais e relacionar fontes históricas ao estudo do passado.",
    observacoes:
      "Turma com foco em leitura, debate, registros no caderno e atividades de interpretação histórica.",
  },
  medio: {
    etapa: "Ensino Médio",
    anoSerie: "3ª série",
    areaConhecimento: "Linguagens e suas Tecnologias",
    componenteCurricular: "Língua Portuguesa",
    cargaHoraria: "80 períodos",
    conteudos:
      "Tipos de texto: descrição, narração e dissertação\nEstrutura dissertativa-argumentativa: introdução com tese, desenvolvimento e conclusão\nCompetências do ENEM: domínio da norma padrão e proposta de intervenção detalhada\nRepertório sociocultural: uso de dados, filosofia, história e literatura nos argumentos",
    objetivos:
      "Desenvolver competências de leitura, análise, argumentação, escrita e revisão de textos.",
    observacoes:
      "Turma com foco em preparação para avaliações externas e produção textual orientada.",
  },
};

function splitConteudos(text: string) {
  return text
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

const planningProgressSteps = [
  "Lendo os dados informados",
  "Organizando conteúdos e habilidades",
  "Montando a matriz pedagógica",
  "Revisando coerência por período",
  "Preparando o resultado final",
];

function PlanningGenerationPanel({
  label,
  context,
}: {
  label: string;
  context: LumiCoachContext;
}) {
  return (
    <div className="mt-6">
      <PlanifyOwlGenerationCoach
        active
        title={label}
        context={context}
        progressSteps={planningProgressSteps}
      />
    </div>
  );
}


function safeFilename(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 90) || "planejamento-planify"
  );
}

function normalizeSkill(skill: any, fallbackConteudo = ""): BnccSkill {
  const codigo = String(skill?.codigo || skill?.code || "BNCC").trim();
  const descricao = String(
    skill?.descricao || skill?.description || skill?.texto || skill?.label || "",
  )
    .replace(codigo, "")
    .replace(/^[-–—:.\s]+/, "")
    .trim();

  return {
    id:
      String(skill?.id || "").trim() ||
      `${codigo}-${fallbackConteudo}-${descricao}`.slice(0, 160),
    codigo,
    descricao: descricao || "Descrição oficial não informada.",
    texto: skill?.texto || `${codigo} — ${descricao}`,
    label: skill?.label || `${codigo} — ${descricao}`,
    etapa: skill?.etapa,
    anoSerie: skill?.anoSerie,
    area: skill?.area,
    componente: skill?.componente,
    conteudo: String(skill?.conteudo || fallbackConteudo || "Conteúdo informado"),
    source: skill?.source === "local" ? "local" : "fallback",
  };
}

function groupSkillsFromResponse(data: any, conteudos: string[]) {
  const groups: BnccGroup[] = [];

  if (Array.isArray(data?.conteudos)) {
    for (const group of data.conteudos) {
      const conteudo = String(group?.conteudo || "").trim();

      if (!conteudo) continue;

      groups.push({
        conteudo,
        habilidades: Array.isArray(group?.habilidades)
          ? group.habilidades.map((skill: any) => normalizeSkill(skill, conteudo))
          : [],
      });
    }
  }

  if (groups.length > 0) return groups;

  return conteudos.map((conteudo) => ({
    conteudo,
    habilidades: [],
  }));
}

function Pill({
  children,
  tone = "cyan",
}: {
  children: React.ReactNode;
  tone?: "cyan" | "emerald" | "slate" | "amber";
}) {
  const styles = {
    cyan: "border-cyan-400/25 bg-cyan-50 text-cyan-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black ${styles[tone]}`}>
      {children}
    </span>
  );
}


function saveAnnualMatrixSnapshot(form: FormState, planning: GeneratedPlanning) {
  if (form.tipoPlanejamento !== "anual") {
    return;
  }

  const snapshot = {
    form,
    planning,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem("planify_matriz_anual", JSON.stringify(snapshot));
}

export function PlanejamentosClient() {
  const { embeddedInDashboard } = usePlanifyWorkspace();
  const school = useSchoolClasses();
  const [form, setForm] = useState<FormState>(initialForm);
  const [groups, setGroups] = useState<BnccGroup[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<BnccSkill[]>([]);
  const [generatedPlanning, setGeneratedPlanning] = useState<GeneratedPlanning | null>(null);
  const [usedAI, setUsedAI] = useState<boolean | null>(null);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [qualityIssues, setQualityIssues] = useState<string[]>([]);
  const [lastGenerationPayload, setLastGenerationPayload] = useState<PlanningAiPayload | null>(
    null,
  );
  const [elevatingQuality, setElevatingQuality] = useState(false);
  const [status, setStatus] = useState("Aguardando");
  const [loadingBncc, setLoadingBncc] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingDocx, setLoadingDocx] = useState(false);
  const [error, setError] = useState("");
  const [abrirEditorAutomatico, setAbrirEditorAutomatico] = useState(true);

  useEffect(() => {
    setAbrirEditorAutomatico(readAutoOpenPlanningEditorPreference());
  }, []);

  useEffect(() => {
    const prefill = readPlanejamentoPrefill();
    const matriz =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("matriz")
        : null;
    const tipoFromUrl =
      matriz === "anual" || matriz === "trimestral" ? matriz : undefined;

    if (!prefill && !tipoFromUrl) return;

    setForm((current) => {
      const next = { ...current };
      if (prefill?.tipo) next.tipoPlanejamento = prefill.tipo;
      else if (tipoFromUrl) next.tipoPlanejamento = tipoFromUrl;
      if (prefill?.conteudos) next.conteudos = prefill.conteudos;
      return next;
    });
  }, []);

  const conteudos = useMemo(() => splitConteudos(form.conteudos), [form.conteudos]);

  const yearOptions = useMemo(() => getYearOptions(form.etapa), [form.etapa]);
  const areaOptions = useMemo(() => getAreaOptions(form.etapa), [form.etapa]);
  const componentOptions = useMemo(
    () => getComponentOptions(form.etapa, form.areaConhecimento),
    [form.etapa, form.areaConhecimento],
  );

  const stats = useMemo(
    () => ({
      conteudos: conteudos.length,
      sugeridas: groups.reduce((total, group) => total + group.habilidades.length, 0),
      selecionadas: selectedSkills.length,
      matriz: generatedPlanning?.conteudos?.length || 0,
    }),
    [conteudos.length, groups, selectedSkills.length, generatedPlanning],
  );

  function invalidateGenerated() {
    setGeneratedPlanning(null);
    setUsedAI(null);
    setQualityScore(null);
    setQualityIssues([]);
    setLastGenerationPayload(null);
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => normalizeEducationalFields(current, { [key]: value }));

    if (
      key === "conteudos" ||
      key === "etapa" ||
      key === "anoSerie" ||
      key === "areaConhecimento" ||
      key === "componenteCurricular" ||
      key === "tipoPlanejamento" ||
      key === "trimestre"
    ) {
      setGroups([]);
      setSelectedSkills([]);
      invalidateGenerated();
      setStatus("Aguardando nova sugestão");
      setError("");
    }
  }

  function applyExample(kind: keyof typeof exemplos) {
    setForm((current) => normalizeEducationalFields(current, exemplos[kind]));
    setGroups([]);
    setSelectedSkills([]);
    invalidateGenerated();
    setStatus("Exemplo preenchido. Agora sugira as habilidades BNCC.");
    setError("");
  }

  function clearAll() {
    setForm(initialForm);
    setGroups([]);
    setSelectedSkills([]);
    invalidateGenerated();
    setStatus("Aguardando");
    setError("");
  }

  function isSelected(skill: BnccSkill) {
    return selectedSkills.some((item) => item.id === skill.id);
  }

  function toggleSkill(skill: BnccSkill) {
    invalidateGenerated();
    setSelectedSkills((current) => {
      const exists = current.some((item) => item.id === skill.id);
      return exists ? current.filter((item) => item.id !== skill.id) : [...current, skill];
    });
  }

  function selectGroup(group: BnccGroup) {
    invalidateGenerated();
    setSelectedSkills((current) => {
      const map = new Map(current.map((skill) => [skill.id, skill]));
      for (const skill of group.habilidades.slice(0, 3)) map.set(skill.id, skill);
      return Array.from(map.values());
    });
  }

  function removeGroup(group: BnccGroup) {
    invalidateGenerated();
    setSelectedSkills((current) =>
      current.filter((skill) => !group.habilidades.some((item) => item.id === skill.id)),
    );
  }

  function buildPlanningEditorMeta(extras?: Partial<PlanningEditorMeta>): PlanningEditorMeta {
    return {
      etapa: form.etapa,
      anoSerie: form.anoSerie,
      componente: form.componenteCurricular,
      tipoPlanejamento: form.tipoPlanejamento,
      escola: form.escola,
      professor: form.professor,
      generationPayload: extras?.generationPayload ?? lastGenerationPayload,
      qualityScore: extras?.qualityScore ?? qualityScore,
      qualityIssues: extras?.qualityIssues ?? qualityIssues,
      ...extras,
    };
  }

  function buildBasePayload() {
    return {
      tipoPlanejamento: form.tipoPlanejamento,
      escola: form.escola,
      professor: form.professor,
      etapa: form.etapa,
      anoSerie: form.anoSerie,
      areaConhecimento: form.areaConhecimento,
      componenteCurricular: form.componenteCurricular,
      cargaHoraria: form.cargaHoraria,
      trimestre: form.trimestre,
      conteudos: form.conteudos,
      objetivosGerais: form.objetivos,
      observacoes: form.observacoes,
      habilidadesSelecionadas: selectedSkills.map((skill) => ({
        codigo: skill.codigo,
        descricao: skill.descricao,
        etapa: skill.etapa || form.etapa,
        anoSerie: skill.anoSerie || form.anoSerie,
        area: skill.area || form.areaConhecimento,
        componente: skill.componente || form.componenteCurricular,
        conteudo: skill.conteudo,
      })),
      classId: school.classId,
      discipline: form.componenteCurricular.trim() || undefined,
      disciplina: form.componenteCurricular.trim() || undefined,
    };
  }

  async function suggestBncc() {
    setError("");

    if (conteudos.length === 0) {
      setError("Informe pelo menos um conteúdo. A sugestão BNCC usa a caixa Conteúdos como base principal.");
      return;
    }

    setLoadingBncc(true);
    setStatus("Buscando habilidades BNCC pelos conteúdos...");

    try {
      const response = await fetch("/api/bncc/sugerir", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBasePayload()),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Não foi possível sugerir habilidades BNCC.");
      }

      const nextGroups = groupSkillsFromResponse(data, conteudos);

      setGroups(nextGroups);
      setSelectedSkills([]);
      invalidateGenerated();
      setStatus("Habilidades sugeridas. Escolha manualmente quais entrarão no planejamento.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao sugerir habilidades BNCC.");
      setStatus("Erro na sugestão");
    } finally {
      setLoadingBncc(false);
    }
  }

  function applyQualityFromResponse(data: {
    qualityScore?: number;
    qualityIssues?: string[];
    warning?: string;
  }) {
    if (typeof data.qualityScore === "number") {
      setQualityScore(data.qualityScore);
    } else {
      setQualityScore(null);
    }

    const issues = Array.isArray(data.qualityIssues)
      ? data.qualityIssues.map((item) => String(item)).filter(Boolean)
      : [];

    if (data.warning && !issues.includes(data.warning)) {
      issues.unshift(data.warning);
    }

    setQualityIssues(issues);
    return issues;
  }

  function persistGeneratedPlanning(
    planning: GeneratedPlanning,
    payload: PlanningAiPayload,
    quality: { qualityScore?: number; qualityIssues?: string[] },
  ) {
    const html = buildPlanningEditorHtml(form, planning);
    const titulo = planning.titulo || "Planejamento";
    const meta = buildPlanningEditorMeta({
      generationPayload: payload,
      qualityScore:
        typeof quality.qualityScore === "number" ? quality.qualityScore : null,
      qualityIssues: quality.qualityIssues ?? [],
    });

    persistPlanningInEditor(html, titulo, meta, planning);
    return html;
  }

  async function generatePlanning() {
    setError("");

    if (conteudos.length === 0) {
      setError("Informe os conteúdos antes de gerar o planejamento.");
      return;
    }

    if (selectedSkills.length === 0) {
      setError("Sugira e selecione pelo menos uma habilidade BNCC antes de gerar o planejamento.");
      return;
    }

    setLoadingPlan(true);
    setStatus("Gerando matriz pedagógica com IA...");

    try {
      const payload = buildBasePayload();
      const data = await requestPlanningGeneration(payload);

      window.dispatchEvent(new Event("planify:credits-changed"));

      const planning = data.planejamento as GeneratedPlanning;
      setGeneratedPlanning(planning);
      saveAnnualMatrixSnapshot(form, planning);
      setUsedAI(Boolean(data.usedAI));
      const issues = applyQualityFromResponse(data);
      setLastGenerationPayload(payload);

      persistGeneratedPlanning(planning, payload, {
        qualityScore: data.qualityScore,
        qualityIssues: issues,
      });

      if (abrirEditorAutomatico) {
        const html = buildPlanningEditorHtml(form, planning);
        const titulo = planning.titulo || "Planejamento";
        openPlanningInEditor(
          html,
          titulo,
          buildPlanningEditorMeta({
            generationPayload: payload,
            qualityScore:
              typeof data.qualityScore === "number" ? data.qualityScore : null,
            qualityIssues: issues,
          }),
          planning,
        );
        return;
      }

      setStatus(
        data.usedAI
          ? "Matriz gerada e salva no histórico. Baixe o DOCX ou edite no editor."
          : "Matriz em modo seguro salva no histórico. Baixe o DOCX ou edite no editor.",
      );

      if (data.warning) {
        setError(data.warning);
      }
    } catch (err) {
      const code =
        err instanceof Error && "code" in err
          ? String((err as Error & { code?: string }).code || "")
          : "";
      if (code === "daily_limit_reached") {
        window.dispatchEvent(new Event("planify:credits-changed"));
      }
      setError(err instanceof Error ? err.message : "Erro ao gerar planejamento com IA.");
      setStatus("Erro ao gerar planejamento");
    } finally {
      setLoadingPlan(false);
    }
  }

  async function elevarQualidadePlanejamento() {
    if (!lastGenerationPayload) {
      setError("Gere o planejamento uma vez antes de elevar a qualidade.");
      return;
    }

    setElevatingQuality(true);
    setError("");

    try {
      const problemas = [
        ...qualityIssues,
        ...(typeof qualityScore === "number" && qualityScore < 90
          ? ["Elevar especificidade da matriz, metodologias e avaliações por conteúdo."]
          : []),
      ];
      const payload = buildElevatePlanningPayload(lastGenerationPayload, problemas);
      const data = await requestPlanningGeneration(payload);

      window.dispatchEvent(new Event("planify:credits-changed"));

      const planning = data.planejamento as GeneratedPlanning;
      setGeneratedPlanning(planning);
      saveAnnualMatrixSnapshot(form, planning);
      setUsedAI(Boolean(data.usedAI));
      const issues = applyQualityFromResponse(data);
      setLastGenerationPayload(payload);

      persistGeneratedPlanning(planning, payload, {
        qualityScore: data.qualityScore,
        qualityIssues: issues,
      });

      setStatus(
        data.usedAI
          ? "Matriz regenerada com foco em qualidade."
          : "Matriz atualizada em modo seguro.",
      );

      if (data.warning) {
        setError(data.warning);
      }
    } catch (err) {
      const code =
        err instanceof Error && "code" in err
          ? String((err as Error & { code?: string }).code || "")
          : "";
      if (code === "daily_limit_reached") {
        window.dispatchEvent(new Event("planify:credits-changed"));
      }
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível elevar a qualidade do planejamento.",
      );
      setStatus("Erro ao elevar qualidade");
    } finally {
      setElevatingQuality(false);
    }
  }

  async function downloadDocxWithMode(mode: DocxDownloadMode, trimester?: number) {
    setError("");

    if (!generatedPlanning) {
      setError("Gere o planejamento anual com IA antes de baixar o DOCX oficial.");
      return;
    }

    setLoadingDocx(true);
    setStatus(
      mode === "trimestral"
        ? `Preenchendo modelo oficial do ${trimester}º trimestre...`
        : "Preenchendo modelo oficial anual...",
    );

    try {
      const filename =
        mode === "trimestral"
          ? `planejamento-trimestral-${trimester}-${form.componenteCurricular}-${form.anoSerie}`
          : `planejamento-anual-${form.componenteCurricular}-${form.anoSerie}`;

      await downloadPlanejamentoOficialDocx(
        {
          ...buildBasePayload(),
          tipoPlanejamento: mode,
          trimestre: trimester ? String(trimester) : form.trimestre,
          matrizPlanejamento: generatedPlanning,
        },
        filename,
      );

      setStatus(
        mode === "trimestral"
          ? `${trimester}º trimestre baixado com base na matriz anual.`
          : "Planejamento anual DOCX oficial baixado.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao baixar DOCX.");
      setStatus("Erro ao gerar DOCX");
    } finally {
      setLoadingDocx(false);
    }
  }

  async function downloadDocx() {
    await downloadDocxWithMode(form.tipoPlanejamento, Number(form.trimestre || 1));
  }

  async function downloadAnnualAndTrimestersPackage() {
    setError("");

    if (!generatedPlanning) {
      setError("Gere o planejamento anual com IA antes de baixar o pacote.");
      return;
    }

    if (form.tipoPlanejamento !== "anual") {
      setError("Para baixar anual + trimestrais, gere primeiro o Planejamento Anual.");
      return;
    }

    setLoadingDocx(true);
    setStatus("Gerando pacote com anual + trimestrais...");

    try {
      const response = await planifyAuthenticatedFetch("/api/planejamentos/docx-pacote", {
        method: "POST",
        body: JSON.stringify({
          ...buildBasePayload(),
          tipoPlanejamento: "anual",
          matrizPlanejamento: generatedPlanning,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message || "Não foi possível gerar o pacote DOCX.");
      }

      const blob = await readDownloadBlob(response);
      triggerBrowserDownload(
        blob,
        `${safeFilename(`planify-anual-trimestrais-${form.componenteCurricular}-${form.anoSerie}`)}.zip`,
      );

      setStatus("Pacote anual + trimestrais baixado com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao baixar pacote.");
      setStatus("Erro ao gerar pacote");
    } finally {
      setLoadingDocx(false);
    }
  }

  function sendToEditor() {
    if (!generatedPlanning) {
      setError("Gere o planejamento com IA antes de enviar para o Editor.");
      return;
    }

    const html = buildPlanningEditorHtml(form, generatedPlanning);
    openPlanningInEditor(
      html,
      generatedPlanning.titulo || "Planejamento",
      buildPlanningEditorMeta(),
      generatedPlanning,
    );
  }

  return (
    <PlanifyWorkspacePane>
      <div className="planify-hud pl-hud-hub mx-auto max-w-7xl space-y-5">
        {!embeddedInDashboard ? (
          <div className="pl-hud-page-hero overflow-hidden rounded-2xl border border-cyan-400/15">
            <PlanifyPageHero
              badge="Planejamentos"
              icon="clipboard"
              title="BNCC → IA → DOCX oficial"
              description="Sugira habilidades por conteúdo, gere a matriz pedagógica com IA e baixe o modelo oficial preenchido."
            />
          </div>
        ) : null}
      <section className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
        <aside className="space-y-6">
          <div className="pl-hud-glass rounded-2xl p-5 sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-600">
              Fluxo correto
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
              Seu planejamento em 3 passos
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-500/90">
              BNCC, matriz com IA e exportação DOCX — tudo alinhado ao que a escola pede.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Conteúdos</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{stats.conteudos}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Selecionadas</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{stats.selecionadas}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Matriz IA</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{stats.matriz}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Status</p>
                <p className="mt-2 text-lg font-black text-slate-950">{status}</p>
              </div>
            </div>

            {generatedPlanning && form.tipoPlanejamento === "anual" ? (
              <div className="mt-6 rounded-[1.75rem] border border-emerald-200/80 bg-emerald-50/80 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-600">
                      Matriz anual aprovada
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-slate-950">
                      Baixar anual e trimestrais coerentes
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-emerald-700/90">
                      Os trimestrais abaixo usam exatamente a mesma matriz anual,
                      os mesmos conteúdos e as mesmas habilidades BNCC. Não há nova
                      busca de BNCC para trimestre.
                    </p>
                  </div>

                  <Pill tone="emerald">Baseado no anual</Pill>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <button
                    type="button"
                    onClick={() => downloadDocxWithMode("anual")}
                    disabled={loadingDocx}
                    className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Anual DOCX
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadDocxWithMode("trimestral", 1)}
                    disabled={loadingDocx}
                    className="pl-hud-btn-secondary rounded-xl px-5 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    1º Trimestre
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadDocxWithMode("trimestral", 2)}
                    disabled={loadingDocx}
                    className="pl-hud-btn-secondary rounded-xl px-5 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    2º Trimestre
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadDocxWithMode("trimestral", 3)}
                    disabled={loadingDocx}
                    className="pl-hud-btn-secondary rounded-xl px-5 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    3º Trimestre
                  </button>

                  <button
                    type="button"
                    onClick={downloadAnnualAndTrimestersPackage}
                    disabled={loadingDocx}
                    className="pl-hud-btn-secondary rounded-xl border border-cyan-400/30 px-5 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Pacote ZIP
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="pl-hud-glass rounded-2xl p-5 sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-600">Exemplos</p>
            <h2 className="mt-4 text-2xl font-black">Preenchimento ideal</h2>
            <div className="mt-6 grid gap-3">
              <button type="button" onClick={() => applyExample("fundamental")} className="pl-hud-btn-secondary rounded-xl px-5 py-3.5 text-sm font-semibold">
                Exemplo Fundamental
              </button>
              <button type="button" onClick={() => applyExample("medio")} className="pl-hud-btn-secondary rounded-xl px-5 py-3.5 text-sm font-semibold">
                Exemplo Ensino Médio
              </button>
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          <div className="pl-hud-glass rounded-2xl border border-cyan-400/20 p-5 sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600">
              Escolha o tipo
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Planejamento anual ou trimestral
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              Informe os conteúdos, deixe a IA montar a matriz BNCC e baixe o
              DOCX oficial em poucos minutos. O trimestral usa a mesma base do
              anual — sem retrabalho.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => updateField("tipoPlanejamento", "anual")}
                className={`rounded-xl border p-5 text-left transition ${
                  form.tipoPlanejamento === "anual"
                    ? "border-cyan-500 bg-cyan-600 text-white shadow-md"
                    : "border-cyan-400/20 bg-white text-slate-950 hover:border-cyan-400/50"
                }`}
              >
                <p className="text-sm font-black">Planejamento Anual</p>
                <p
                  className={`mt-1 text-xs font-semibold ${
                    form.tipoPlanejamento === "anual"
                      ? "text-cyan-100"
                      : "text-slate-500"
                  }`}
                >
                  Matriz do ano letivo · modelo oficial completo
                </p>
              </button>
              <button
                type="button"
                onClick={() => updateField("tipoPlanejamento", "trimestral")}
                className={`rounded-xl border p-5 text-left transition ${
                  form.tipoPlanejamento === "trimestral"
                    ? "border-cyan-500 bg-cyan-600 text-white shadow-md"
                    : "border-cyan-400/20 bg-white text-slate-950 hover:border-cyan-400/50"
                }`}
              >
                <p className="text-sm font-black">Planejamento Trimestral</p>
                <p
                  className={`mt-1 text-xs font-semibold ${
                    form.tipoPlanejamento === "trimestral"
                      ? "text-cyan-100"
                      : "text-slate-500"
                  }`}
                >
                  1º, 2º ou 3º trimestre · coerente com o anual
                </p>
              </button>
            </div>
          </div>

          <div className="pl-hud-glass rounded-2xl p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-600">Dados</p>
                <h2 className="mt-4 text-3xl font-black text-slate-950">Informações do planejamento</h2>
              </div>
              <button type="button" onClick={clearAll} className="pl-hud-btn-secondary rounded-xl px-5 py-3 text-sm font-semibold">
                Limpar tudo
              </button>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-500">Escola</span>
                <input value={form.escola} onChange={(event) => updateField("escola", event.target.value)} placeholder="Nome da escola" className={HUD_FIELD_CLASS} />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-500">Professor</span>
                <input value={form.professor} onChange={(event) => updateField("professor", event.target.value)} placeholder="Nome do professor" className={HUD_FIELD_CLASS} />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-500">Etapa</span>
                <select value={form.etapa} onChange={(event) => updateField("etapa", event.target.value)} className={HUD_FIELD_CLASS}>
                  {Object.keys(EDUCATION_OPTIONS).map((stage) => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-500">Ano/Série</span>
                <select value={form.anoSerie} onChange={(event) => updateField("anoSerie", event.target.value)} className={HUD_FIELD_CLASS}>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-500">Área do conhecimento</span>
                <select value={form.areaConhecimento} onChange={(event) => updateField("areaConhecimento", event.target.value)} className={HUD_FIELD_CLASS}>
                  {areaOptions.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-500">Componente curricular</span>
                <select value={form.componenteCurricular} onChange={(event) => updateField("componenteCurricular", event.target.value)} className={HUD_FIELD_CLASS}>
                  {componentOptions.map((component) => (
                    <option key={component} value={component}>{component}</option>
                  ))}
                </select>
              </label>
              <TurmaSelect school={school} className="grid gap-2 md:col-span-2" />
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-500">Carga horária</span>
                <input value={form.cargaHoraria} onChange={(event) => updateField("cargaHoraria", event.target.value)} placeholder="Ex.: 80 períodos" className={HUD_FIELD_CLASS} />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-500">Tipo</span>
                <select value={form.tipoPlanejamento} onChange={(event) => updateField("tipoPlanejamento", event.target.value as TipoPlanejamento)} className={HUD_FIELD_CLASS}>
                  <option value="anual">Anual</option>
                  <option value="trimestral">Trimestral</option>
                </select>
              </label>
              {form.tipoPlanejamento === "trimestral" ? (
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-500">Trimestre</span>
                  <select value={form.trimestre} onChange={(event) => updateField("trimestre", event.target.value)} className={HUD_FIELD_CLASS}>
                    <option value="1">1º trimestre</option>
                    <option value="2">2º trimestre</option>
                    <option value="3">3º trimestre</option>
                  </select>
                </label>
              ) : null}
            </div>

            <div className="mt-5 grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-500">Conteúdos</span>
                <textarea value={form.conteudos} onChange={(event) => updateField("conteudos", event.target.value)} rows={6} placeholder={"Digite um conteúdo por linha.\nEx.: Estrutura dissertativa-argumentativa\nEx.: Repertório sociocultural"} className={HUD_TEXTAREA_CLASS} />
                <span className="text-xs text-cyan-700/80">Este campo é suficiente para buscar e sugerir habilidades BNCC.</span>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-500">Objetivos gerais</span>
                <textarea value={form.objetivos} onChange={(event) => updateField("objetivos", event.target.value)} rows={3} placeholder="Opcional. Ajuda no texto pedagógico do DOCX." className={HUD_TEXTAREA_CLASS} />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-500">Observações</span>
                <textarea value={form.observacoes} onChange={(event) => updateField("observacoes", event.target.value)} rows={3} placeholder="Opcional. Informe perfil da turma, foco pedagógico ou necessidades específicas." className={HUD_TEXTAREA_CLASS} />
              </label>
            </div>

            {error ? (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
                {error}
              </div>
            ) : null}

            <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-xl border border-cyan-400/20 bg-cyan-50/50 px-5 py-3">
              <input
                type="checkbox"
                checked={abrirEditorAutomatico}
                onChange={(event) => {
                  const enabled = event.target.checked;
                  setAbrirEditorAutomatico(enabled);
                  writeAutoOpenPlanningEditorPreference(enabled);
                }}
                className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-200"
              />
              <span className="text-sm font-semibold text-slate-800">
                Abrir no editor automaticamente após gerar (salva também no histórico)
              </span>
            </label>

            <div className="mt-6">
              <DailyGenerationsBar tipoMaterial={PLANNING_DEEP_GENERATION_TYPE} />
            </div>

            <div className="mt-7 grid gap-3 xl:grid-cols-4">
              <button type="button" onClick={suggestBncc} disabled={loadingBncc} className="pl-hud-btn-secondary rounded-xl px-5 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">
                {loadingBncc ? "Sugerindo BNCC..." : "1. Sugerir BNCC"}
              </button>
              <button type="button" onClick={generatePlanning} disabled={loadingPlan} className="pl-hud-btn-generate rounded-full px-6 py-4 text-sm transition disabled:cursor-not-allowed">
                {loadingPlan ? "Gerando com IA..." : "2. Gerar planejamento com IA"}
              </button>
              <button type="button" onClick={sendToEditor} disabled={!generatedPlanning} className="pl-hud-btn-secondary rounded-xl px-5 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">
                Editar no editor
              </button>
              <button type="button" onClick={downloadDocx} disabled={loadingDocx || !generatedPlanning} className="pl-hud-btn-secondary rounded-xl border border-emerald-300/40 px-5 py-3.5 text-sm font-semibold text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
                {loadingDocx ? "Preenchendo DOCX..." : "3. Baixar DOCX atual"}
              </button>
            </div>

            {loadingBncc || loadingPlan || loadingDocx ? (
              <PlanningGenerationPanel
                label={
                  loadingBncc
                    ? "Buscando habilidades compatíveis"
                    : loadingDocx
                      ? "Preparando documento oficial"
                      : "Gerando planejamento com IA"
                }
                context={
                  loadingBncc ? "bncc" : loadingDocx ? "docx" : "planejamento"
                }
              />
            ) : null}

            {generatedPlanning ? (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <MarketplacePublishButton
                  title={generatedPlanning.titulo || "Planejamento"}
                  getHtml={() => buildPlanningEditorHtml(form, generatedPlanning)}
                  tipoMaterial="Planejamento"
                  tema={form.componenteCurricular}
                  componente={form.componenteCurricular}
                  etapa={form.etapa}
                  anoSerie={form.anoSerie}
                />
              </div>
            ) : null}

            {generatedPlanning && form.tipoPlanejamento === "anual" ? (
              <div className="mt-6 rounded-[1.75rem] border border-emerald-200/80 bg-emerald-50/80 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-600">
                      Matriz anual aprovada
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-slate-950">
                      Baixar anual e trimestrais coerentes
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-emerald-700/90">
                      Os trimestrais abaixo usam exatamente a mesma matriz anual,
                      os mesmos conteúdos e as mesmas habilidades BNCC. Não há nova
                      busca de BNCC para trimestre.
                    </p>
                  </div>

                  <Pill tone="emerald">Baseado no anual</Pill>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <button
                    type="button"
                    onClick={() => downloadDocxWithMode("anual")}
                    disabled={loadingDocx}
                    className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Anual DOCX
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadDocxWithMode("trimestral", 1)}
                    disabled={loadingDocx}
                    className="pl-hud-btn-secondary rounded-xl px-5 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    1º Trimestre
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadDocxWithMode("trimestral", 2)}
                    disabled={loadingDocx}
                    className="pl-hud-btn-secondary rounded-xl px-5 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    2º Trimestre
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadDocxWithMode("trimestral", 3)}
                    disabled={loadingDocx}
                    className="pl-hud-btn-secondary rounded-xl px-5 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    3º Trimestre
                  </button>

                  <button
                    type="button"
                    onClick={downloadAnnualAndTrimestersPackage}
                    disabled={loadingDocx}
                    className="pl-hud-btn-secondary rounded-xl border border-cyan-400/30 px-5 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Pacote ZIP
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="pl-hud-glass rounded-2xl p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-600">BNCC por conteúdo</p>
                <h2 className="mt-4 text-3xl font-black text-slate-950">Habilidades sugeridas</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">As sugestões vêm desmarcadas por padrão. Clique apenas nas habilidades que deseja usar no planejamento.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Pill tone="cyan">{stats.sugeridas} sugeridas</Pill>
                <Pill tone="emerald">{stats.selecionadas} selecionadas</Pill>
                {usedAI !== null ? <Pill tone={usedAI ? "emerald" : "amber"}>{usedAI ? "IA usada" : "Modo seguro"}</Pill> : null}
              </div>
            </div>

            {groups.length === 0 ? (
              <div className="mt-7 rounded-2xl border border-dashed border-blue-200 bg-slate-50/50 p-7 text-sm leading-7 text-slate-500">
                Nenhuma sugestão ainda. Preencha os conteúdos e clique em <strong className="text-slate-950">Sugerir BNCC</strong>.
              </div>
            ) : (
              <div className="mt-7 grid gap-5">
                {groups.map((group) => (
                  <div key={group.conteudo} className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">Conteúdo</p>
                        <h3 className="mt-2 text-xl font-black text-slate-950">{group.conteudo}</h3>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => selectGroup(group)} className="rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-xs font-black text-emerald-100 transition hover:bg-emerald-300/20">
                          Selecionar grupo
                        </button>
                        <button type="button" onClick={() => removeGroup(group)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:border-rose-300 hover:bg-slate-50 hover:text-rose-700">
                          Remover
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3">
                      {group.habilidades.map((skill) => {
                        const selected = isSelected(skill);
                        return (
                          <button key={skill.id} type="button" onClick={() => toggleSkill(skill)} className={`rounded-xl border p-5 text-left transition hover:-translate-y-0.5 ${selected ? "border-emerald-300/60 bg-emerald-50/80" : "border-cyan-400/15 bg-white/80 hover:border-cyan-400/35 hover:bg-cyan-50/40"}`}>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-lg font-extrabold text-slate-950">{skill.codigo}</p>
                                <p className="mt-2 text-sm leading-7 text-slate-600">{skill.descricao}</p>
                              </div>
                              <Pill tone={selected ? "emerald" : "slate"}>{selected ? "Selecionada" : "Clique para usar"}</Pill>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {generatedPlanning ? (
              <div className="mt-7 rounded-[1.75rem] border border-emerald-200/80 bg-emerald-50/80 p-5">
                {typeof qualityScore === "number" ? (
                  <MaterialQualityScoreBar
                    score={qualityScore}
                    issues={qualityIssues}
                    compact
                    onElevate={
                      lastGenerationPayload
                        ? () => void elevarQualidadePlanejamento()
                        : undefined
                    }
                    elevating={elevatingQuality}
                  />
                ) : null}
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-600">Matriz gerada</p>
                <h3 className="mt-3 text-2xl font-black text-slate-950">{generatedPlanning.titulo}</h3>
                <p className="mt-3 text-sm leading-7 text-emerald-700/90">{generatedPlanning.resumo}</p>
                <div className="mt-4 grid gap-2">
                  {generatedPlanning.conteudos.map((item) => (
                    <div key={`${item.conteudo}-${item.aulaInicio}`} className="rounded-2xl border border-slate-200/80 bg-white/80 p-4">
                      <p className="font-black text-slate-950">{item.conteudo}</p>
                      <p className="mt-1 text-sm text-slate-400">Aulas {item.aulaInicio} a {item.aulaFim} · {item.habilidades.length} habilidade(s)</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </section>
      </div>
    </PlanifyWorkspacePane>
  );
}
