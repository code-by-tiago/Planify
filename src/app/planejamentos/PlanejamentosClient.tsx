"use client";

import { MaterialPreviewSkeleton } from "@/components/materiais/MaterialPreviewSkeleton";
import { MaterialQualityScoreBar } from "@/components/materiais/MaterialQualityScoreBar";
import {
  dispatchCreditsChangedIfNeeded,
  formatGenerationError,
  GenerationErrorBanner,
} from "@/lib/pro/generation-error-ui";
import { MarketplacePublishButton } from "@/components/marketplace/MarketplacePublishButton";
import { PlanifyOwlGenerationCoach } from "@/components/pro/PlanifyOwlGenerationCoach";
import { PlanifyWorkspacePane } from "@/components/pro/PlanifyWorkspacePane";
import { useSchoolClasses } from "@/hooks/useSchoolClasses";
import { useTeacherTeachingContext } from "@/hooks/useTeacherTeachingContext";
import { MinhaTurmaChip } from "@/components/teacher/MinhaTurmaChip";
import { TurmaCombobox } from "@/components/school/TurmaCombobox";
import { PlanifyPageHero } from "@/components/pro/PlanifyPageHero";
import { usePlanifyWorkspace } from "@/components/pro/planify-workspace-context";
import {
  HUD_FIELD_CLASS,
  HUD_SCROLLABLE_TEXTAREA_CLASS,
  HUD_TEXTAREA_CLASS,
} from "@/lib/pro/hud-form-styles";
import type { LumiCoachContext } from "@/lib/pro/lumiMotivationalMessages";
import {
  openPlanningInEditor,
  persistPlanningInEditor,
  readAutoOpenPlanningEditorPreference,
  writeAutoOpenPlanningEditorPreference,
  type PlanningEditorMeta,
} from "@/lib/planejamentos/planning-editor-flow";
import {
  buildPlanningBundleDocumentId,
  openPlanningBundleInEditor,
  pacoteTrimestralAnualToTrimestres,
  persistPlanningBundleDocuments,
  type PacoteTrimestralAnual,
  type PlanningBundleDocumentInput,
} from "@/lib/planejamentos/planning-editor-bundle";
import {
  buildElevatePlanningPayload,
  requestPlanningGeneration,
} from "@/lib/planejamentos/elevate-planning-client";
import { buildPlanningEditorHtml } from "@/lib/planejamentos/planning-editor-html";
import type {
  PlanningAiPayload,
  PlanningMatrixItem,
} from "@/server/planejamentos/planning-ai-service";
import { readPlanejamentoPrefill } from "@/lib/planejamentos/planejamento-prefill";
import { PlanningOfficialExportBar } from "@/components/planejamentos/PlanningOfficialExportBar";
import {
  PlanningWizardStepper,
  type PlanningWizardStep,
} from "@/components/planejamentos/PlanningWizardStepper";
import { buildOfficialPlanningPayloadFromGeneration } from "@/lib/planejamentos/planning-google-export-payload";
import {
  assembleClientPlanningPackage,
  resolveBundleActiveIndex,
} from "@/lib/planejamentos/planning-package-assembler";
import {
  buildTrimestralPlansFromAnnual,
  trimestralCargaHorariaLabel,
  type TrimestralPlanningLike,
} from "@/lib/planejamentos/planning-trimestral-from-annual";
import { useBnccEducationOptions } from "@/hooks/useBnccEducationOptions";
import type { MaterialEducationFields } from "@/lib/educacao/education-options";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { splitTopicLines } from "@/lib/bncc/split-topic-lines";
import { TemaCombobox } from "@/components/bncc/TemaCombobox";
import type { BnccTemaAutocompleteSuggestion } from "@/lib/bncc/bncc-tema-autocomplete";

type TipoPlanejamento = "anual" | "trimestral";

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
  pacoteTrimestralAnual: PacoteTrimestralAnual;
  conteudos: string;
  objetivos: string;
  observacoes: string;
};

type MatrizPreviewKey = "anual" | 1 | 2 | 3;

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
  pacoteTrimestralAnual: "nenhum",
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
        estimatedDurationMs={150_000}
      />
      <MaterialPreviewSkeleton />
    </div>
  );
}


const TRIMESTRES_DISPONIVEIS = [1, 2, 3] as const;

const PACOTE_TRIMESTRAL_OPTIONS: Array<{
  value: PacoteTrimestralAnual;
  label: string;
}> = [
  { value: "nenhum", label: "Só planejamento anual" },
  { value: "1", label: "Planejamento anual + 1º trimestre" },
  { value: "2", label: "Planejamento anual + 2º trimestre" },
  { value: "3", label: "Planejamento anual + 3º trimestre" },
];

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
  const teachingContext = useTeacherTeachingContext();
  const autoAppliedTeachingContextRef = useRef(false);
  const fieldIdEscola = useId();
  const fieldIdProfessor = useId();
  const fieldIdEtapa = useId();
  const fieldIdAnoSerie = useId();
  const fieldIdArea = useId();
  const fieldIdComponente = useId();
  const fieldIdConteudos = useId();
  const [form, setForm] = useState<FormState>(initialForm);
  const [temaBusca, setTemaBusca] = useState("");
  const [groups, setGroups] = useState<BnccGroup[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<BnccSkill[]>([]);
  const [generatedPlanning, setGeneratedPlanning] = useState<GeneratedPlanning | null>(null);
  const [generatedTrimestralPlans, setGeneratedTrimestralPlans] = useState<Partial<
    Record<number, TrimestralPlanningLike>
  > | null>(null);
  const [previewMatrizKey, setPreviewMatrizKey] = useState<MatrizPreviewKey>("anual");
  const [usedAI, setUsedAI] = useState<boolean | null>(null);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [qualityIssues, setQualityIssues] = useState<string[]>([]);
  const [lastGenerationPayload, setLastGenerationPayload] = useState<PlanningAiPayload | null>(
    null,
  );
  const [elevatingQuality, setElevatingQuality] = useState(false);
  const [status, setStatus] = useState("Aguardando");
  const [loadingBncc, setLoadingBncc] = useState(false);
  const [refreshingConteudo, setRefreshingConteudo] = useState<string | null>(null);
  const [contentRefreshOffsets, setContentRefreshOffsets] = useState<Record<string, number>>(
    {},
  );
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [error, setError] = useState("");
  const [errorCta, setErrorCta] = useState<ReturnType<typeof formatGenerationError>["cta"]>(null);
  const [errorRetryable, setErrorRetryable] = useState(false);
  const [abrirEditorAutomatico, setAbrirEditorAutomatico] = useState(true);
  const [wizardStep, setWizardStep] = useState<PlanningWizardStep>(1);

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

  const conteudosPreenchido = Boolean(form.conteudos.trim());

  const educationFields = useMemo(
    (): MaterialEducationFields => ({
      etapa: form.etapa,
      anoSerie: form.anoSerie,
      areaConhecimento: form.areaConhecimento,
      componente: form.componenteCurricular,
    }),
    [form.etapa, form.anoSerie, form.areaConhecimento, form.componenteCurricular],
  );

  const {
    stageOptions,
    yearOptions,
    areaOptions,
    componentOptions,
    applyEducation: applyBnccEducation,
  } = useBnccEducationOptions(educationFields, (next) => {
    setForm((current) => ({
      ...current,
      etapa: next.etapa,
      anoSerie: next.anoSerie,
      areaConhecimento: next.areaConhecimento,
      componenteCurricular: next.componente,
    }));
  });

  const applyEducationFields = useCallback(
    (patch: Partial<MaterialEducationFields>) => {
      applyBnccEducation(patch);
      setGroups([]);
      setSelectedSkills([]);
      setContentRefreshOffsets({});
      invalidateGenerated();
      setStatus("Aguardando nova sugestão");
      setError("");
      teachingContext.resetApplied();
    },
    [applyBnccEducation, teachingContext],
  );

  const applyTeachingContextFields = useCallback(
    (fields: {
      etapa: string;
      anoSerie: string;
      areaConhecimento: string;
      componente: string;
      turma: string;
      classId: string | null;
      observacoesTurma: string;
    }) => {
      applyEducationFields({
        etapa: fields.etapa,
        anoSerie: fields.anoSerie,
        areaConhecimento: fields.areaConhecimento,
        componente: fields.componente,
      });
      if (fields.turma) {
        school.setTurmaInput(fields.turma);
      } else if (fields.classId) {
        school.setClassId(fields.classId);
      }
      if (fields.observacoesTurma && !form.observacoes.trim()) {
        setForm((current) => ({
          ...current,
          observacoes: fields.observacoesTurma,
        }));
      }
    },
    [applyEducationFields, form.observacoes, school],
  );

  const currentTeachingFields = useCallback(
    () => ({
      etapa: form.etapa,
      anoSerie: form.anoSerie,
      areaConhecimento: form.areaConhecimento,
      componente: form.componenteCurricular,
      turma: school.turmaDisplayValue,
      classId: school.classId,
      observacoesTurma: form.observacoes,
    }),
    [
      form.anoSerie,
      form.areaConhecimento,
      form.componenteCurricular,
      form.etapa,
      form.observacoes,
      school.classId,
      school.turmaDisplayValue,
    ],
  );

  const saveTeachingContextDefaults = useCallback(() => {
    teachingContext.saveCurrentAsDefault(currentTeachingFields());
  }, [currentTeachingFields, teachingContext]);

  useEffect(() => {
    if (teachingContext.loading || autoAppliedTeachingContextRef.current) return;
    if (!teachingContext.configured) return;

    autoAppliedTeachingContextRef.current = true;
    teachingContext.applyToForm(applyTeachingContextFields);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-apply once on mount
  }, [teachingContext.loading, teachingContext.configured]);

  const stats = useMemo(
    () => ({
      conteudos: conteudosPreenchido ? 1 : 0,
      sugeridas: groups.reduce((total, group) => total + group.habilidades.length, 0),
      selecionadas: selectedSkills.length,
      matriz: generatedPlanning?.conteudos?.length || 0,
    }),
    [conteudosPreenchido, groups, selectedSkills.length, generatedPlanning],
  );

  const canGoToWizardStep2 = conteudosPreenchido;
  const canGoToWizardStep3 = Boolean(generatedPlanning);

  useEffect(() => {
    if (generatedPlanning) {
      setWizardStep(3);
      return;
    }
    if (groups.length > 0 || selectedSkills.length > 0) {
      setWizardStep((current) => (current < 2 ? 2 : current));
    }
  }, [generatedPlanning, groups.length, selectedSkills.length]);

  function invalidateGenerated() {
    setGeneratedPlanning(null);
    setGeneratedTrimestralPlans(null);
    setPreviewMatrizKey("anual");
    setUsedAI(null);
    setQualityScore(null);
    setQualityIssues([]);
    setLastGenerationPayload(null);
  }

  const syncTrimestralPlansFromAnnual = useCallback(
    (annual: GeneratedPlanning | null, nextForm: FormState) => {
      if (!annual || nextForm.tipoPlanejamento !== "anual") {
        setGeneratedTrimestralPlans(null);
        setPreviewMatrizKey("anual");
        return;
      }

      const snapshot = assembleClientPlanningPackage(annual, nextForm.pacoteTrimestralAnual);

      if (!snapshot.trimestres.length) {
        setGeneratedTrimestralPlans(null);
        setPreviewMatrizKey("anual");
        return;
      }

      setGeneratedTrimestralPlans(snapshot.trimestrais);
    },
    [],
  );

  useEffect(() => {
    syncTrimestralPlansFromAnnual(generatedPlanning, form);
  }, [
    form.pacoteTrimestralAnual,
    form.tipoPlanejamento,
    generatedPlanning,
    syncTrimestralPlansFromAnnual,
  ]);

  const activePreviewPlanning = useMemo(() => {
    if (!generatedPlanning) {
      return null;
    }

    if (
      previewMatrizKey !== "anual" &&
      generatedTrimestralPlans?.[previewMatrizKey]
    ) {
      return generatedTrimestralPlans[previewMatrizKey]!;
    }

    return generatedPlanning;
  }, [generatedPlanning, generatedTrimestralPlans, previewMatrizKey]);

  const trimestresDisponiveisDownload = useMemo(() => {
    if (form.pacoteTrimestralAnual !== "nenhum") {
      const selected = pacoteTrimestralAnualToTrimestres(form.pacoteTrimestralAnual);
      if (selected.length > 0) {
        return selected;
      }
    }

    return [...TRIMESTRES_DISPONIVEIS];
  }, [form.pacoteTrimestralAnual]);

  function invalidateConteudosDependents() {
    setGroups([]);
    setSelectedSkills([]);
    setContentRefreshOffsets({});
    invalidateGenerated();
    setStatus("Aguardando nova sugestão");
    setError("");
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
      invalidateConteudosDependents();
    }
  }

  function applyExample(kind: keyof typeof exemplos) {
    setForm((current) => normalizeEducationalFields(current, exemplos[kind]));
    setGroups([]);
    setSelectedSkills([]);
    setContentRefreshOffsets({});
    invalidateGenerated();
    setStatus("Exemplo preenchido. Agora sugira as habilidades BNCC.");
    setError("");
  }

  function clearAll() {
    setForm(initialForm);
    setGroups([]);
    setSelectedSkills([]);
    setContentRefreshOffsets({});
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
      ...school.turmaPayload,
      discipline: form.componenteCurricular.trim() || undefined,
      disciplina: form.componenteCurricular.trim() || undefined,
    };
  }

  function handleTemaSuggestionSelect(suggestion: BnccTemaAutocompleteSuggestion) {
    const habilidades = suggestion.habilidades.map((skill) =>
      normalizeSkill(skill, suggestion.tema),
    );

    setForm((current) =>
      normalizeEducationalFields(current, { conteudos: suggestion.tema }),
    );
    setTemaBusca(suggestion.tema);
    setGroups([{ conteudo: suggestion.tema, habilidades }]);
    setSelectedSkills(habilidades.slice(0, 3));
    setContentRefreshOffsets({});
    invalidateGenerated();
    setStatus("Tema BNCC selecionado. Revise as habilidades sugeridas.");
    setError("");
  }

  async function suggestBncc() {
    setError("");

    const conteudosText = form.conteudos.trim();

    if (!conteudosText) {
      setError("Informe os conteúdos na caixa Conteúdos antes de sugerir BNCC.");
      return;
    }

    const topicLines = splitTopicLines(conteudosText);

    setLoadingBncc(true);
    setStatus("Buscando habilidades BNCC pelos conteúdos...");

    try {
      const response = await fetch("/api/bncc/sugerir", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...buildBasePayload(),
          conteudos: conteudosText,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Não foi possível sugerir habilidades BNCC.");
      }

      const nextGroups = groupSkillsFromResponse(data, topicLines);

      setGroups(nextGroups);
      setSelectedSkills([]);
      setContentRefreshOffsets({});
      invalidateGenerated();
      setStatus("Habilidades sugeridas. Escolha manualmente quais entrarão no planejamento.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao sugerir habilidades BNCC.");
      setStatus("Erro na sugestão");
    } finally {
      setLoadingBncc(false);
    }
  }

  async function refreshContentBncc(group: BnccGroup) {
    setError("");

    const excludeCodigos = group.habilidades
      .map((skill) => skill.codigo.trim())
      .filter(Boolean);
    const nextOffset = (contentRefreshOffsets[group.conteudo] ?? 0) + 1;

    setRefreshingConteudo(group.conteudo);
    setStatus(`Buscando outras opções para: ${group.conteudo}`);

    try {
      const response = await fetch("/api/bncc/sugerir", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          etapa: form.etapa,
          anoSerie: form.anoSerie,
          areaConhecimento: form.areaConhecimento,
          componenteCurricular: form.componenteCurricular,
          conteudos: group.conteudo,
          refresh: true,
          excludeCodigos,
          offset: nextOffset,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Não foi possível buscar outras habilidades BNCC.");
      }

      const refreshedGroups = groupSkillsFromResponse(data, [group.conteudo]);
      const refreshed =
        refreshedGroups.find((item) => item.conteudo === group.conteudo) ?? refreshedGroups[0];

      if (!refreshed?.habilidades.length) {
        setError(
          String(data?.message || "Sem outras opções compatíveis com este conteúdo."),
        );
        setStatus("Sem outras opções compatíveis");
        return;
      }

      const replacedCodes = new Set(group.habilidades.map((skill) => skill.codigo));
      const newCodes = new Set(refreshed.habilidades.map((skill) => skill.codigo));

      setGroups((current) =>
        current.map((item) =>
          item.conteudo === group.conteudo
            ? { conteudo: group.conteudo, habilidades: refreshed.habilidades }
            : item,
        ),
      );

      setSelectedSkills((current) =>
        current.filter(
          (skill) =>
            skill.conteudo !== group.conteudo ||
            !replacedCodes.has(skill.codigo) ||
            newCodes.has(skill.codigo),
        ),
      );

      setContentRefreshOffsets((current) => ({
        ...current,
        [group.conteudo]: nextOffset,
      }));

      invalidateGenerated();
      setStatus(
        refreshed.habilidades.length < 3
          ? `Foram encontradas ${refreshed.habilidades.length} alternativa(s) compatíveis com este conteúdo.`
          : "Novas opções carregadas para este conteúdo. Escolha as habilidades desejadas.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar outras habilidades BNCC.");
      setStatus("Erro na sugestão");
    } finally {
      setRefreshingConteudo(null);
    }
  }

  function applyQualityFromResponse(data: {
    qualityScore?: number;
    qualityIssues?: string[];
    warning?: string;
    persistWarning?: string | null;
    alertas?: string[];
  }) {
    if (typeof data.qualityScore === "number") {
      setQualityScore(data.qualityScore);
    } else {
      setQualityScore(null);
    }

    const issues = Array.isArray(data.qualityIssues)
      ? data.qualityIssues.map((item) => String(item)).filter(Boolean)
      : [];

    const alertas = Array.isArray(data.alertas)
      ? data.alertas.map((item) => String(item)).filter(Boolean)
      : [];

    for (const item of alertas) {
      if (!issues.includes(item)) {
        issues.push(item);
      }
    }

    if (data.warning && !issues.includes(data.warning)) {
      issues.unshift(data.warning);
    }

    const persistWarning =
      typeof data.persistWarning === "string" ? data.persistWarning.trim() : "";
    if (persistWarning && !issues.includes(persistWarning)) {
      issues.unshift(persistWarning);
    }

    setQualityIssues(issues);
    return issues;
  }

  function persistGeneratedPlanning(
    planning: GeneratedPlanning,
    payload: PlanningAiPayload,
    quality: {
      qualityScore?: number;
      qualityIssues?: string[];
      serverMaterialId?: string;
    },
  ) {
    const html = buildPlanningEditorHtml(form, planning);
    const titulo = planning.titulo || "Planejamento";
    const meta = buildPlanningEditorMeta({
      generationPayload: payload,
      qualityScore:
        typeof quality.qualityScore === "number" ? quality.qualityScore : null,
      qualityIssues: quality.qualityIssues ?? [],
      serverMaterialId: quality.serverMaterialId,
    });

    persistPlanningInEditor(html, titulo, meta, planning);
    return html;
  }

  function buildPlanningBundleDocuments(
    planning: GeneratedPlanning,
    trimestres: number[],
    payload: PlanningAiPayload,
    quality: {
      qualityScore?: number | null;
      qualityIssues?: string[];
      serverMaterialId?: string;
    },
    trimestralPlans: Partial<Record<number, TrimestralPlanningLike>>,
  ): PlanningBundleDocumentInput[] {
    const idempotencyKey = String(payload.idempotencyKey || "").trim();
    const sharedMeta = buildPlanningEditorMeta({
      generationPayload: payload,
      qualityScore:
        typeof quality.qualityScore === "number" ? quality.qualityScore : null,
      qualityIssues: quality.qualityIssues ?? [],
      serverMaterialId: quality.serverMaterialId,
    });

    const anualForm = {
      ...form,
      tipoPlanejamento: "anual" as const,
    };
    const anualHtml = buildPlanningEditorHtml(anualForm, planning);

    const annualGenerationPayload = sharedMeta.generationPayload
      ? { ...sharedMeta.generationPayload, tipoPlanejamento: "anual" as const }
      : sharedMeta.generationPayload;

    const documents: PlanningBundleDocumentInput[] = [
      {
        id: buildPlanningBundleDocumentId(idempotencyKey, "anual"),
        label: "Anual",
        title: planning.titulo || "Planejamento anual",
        html: anualHtml,
        type: "planejamento:anual",
        meta: {
          ...sharedMeta,
          tipoPlanejamento: "anual",
          generationPayload: annualGenerationPayload,
        },
        planning,
      },
    ];

    for (const trimestre of trimestres) {
      const trimPlan = trimestralPlans[trimestre];
      if (!trimPlan?.conteudos?.length) {
        continue;
      }

      const trimForm = {
        ...form,
        tipoPlanejamento: "trimestral" as const,
        trimestre: String(trimestre),
        cargaHoraria: trimestralCargaHorariaLabel(trimPlan.conteudos),
      };

      const trimCargaHoraria = trimestralCargaHorariaLabel(trimPlan.conteudos);
      const trimGenerationPayload = sharedMeta.generationPayload
        ? {
            ...sharedMeta.generationPayload,
            tipoPlanejamento: "trimestral" as const,
            trimestre: String(trimestre),
            cargaHoraria: trimCargaHoraria,
          }
        : sharedMeta.generationPayload;

      documents.push({
        id: buildPlanningBundleDocumentId(
          idempotencyKey,
          `trim${trimestre}` as "trim1" | "trim2" | "trim3",
        ),
        label: `${trimestre}º trimestre`,
        title: trimPlan.titulo || `${trimestre}º trimestre`,
        html: buildPlanningEditorHtml(trimForm, trimPlan),
        type: "planejamento:trimestral",
        meta: {
          ...sharedMeta,
          tipoPlanejamento: "trimestral",
          trimestre: String(trimestre),
          generationPayload: trimGenerationPayload,
        },
        planning: trimPlan,
      });
    }

    return documents;
  }

  async function generatePlanning() {
    if (loadingPlan) return;

    setError("");
    setErrorCta(null);
    setErrorRetryable(false);

    const conteudosText = form.conteudos.trim();

    if (!conteudosText) {
      setError("Informe os conteúdos antes de gerar o planejamento.");
      return;
    }

    if (selectedSkills.length === 0) {
      setError("Sugira e selecione pelo menos uma habilidade BNCC antes de gerar o planejamento.");
      return;
    }

    setLoadingPlan(true);
    setStatus("Gerando planejamento com IA...");

    const idempotencyKey = crypto.randomUUID();

    const runGeneration = async (useBnccMode: boolean) => {
      const turma = school.turmaPayload;
      if (turma.className) {
        await school.rememberPersonalClass(turma.className);
      }

      const payload = {
        ...buildBasePayload(),
        conteudos: conteudosText,
        idempotencyKey,
        ...(useBnccMode
          ? {
              modoMatrizBncc: true as const,
              trimestresNoPacote:
                form.tipoPlanejamento === "anual"
                  ? pacoteTrimestralAnualToTrimestres(form.pacoteTrimestralAnual)
                  : [],
            }
          : {}),
      };
      const data = await requestPlanningGeneration(payload);

      if (!useBnccMode) {
        window.dispatchEvent(new Event("planify:credits-changed"));
      }

      const serverMaterialId =
        typeof data.materialId === "string" && data.materialId.trim()
          ? data.materialId.trim()
          : undefined;

      const planning = data.planejamento as GeneratedPlanning;
      const serverPackage =
        data.package &&
        typeof data.package === "object" &&
        data.package !== null &&
        !Array.isArray(data.package)
          ? (data.package as ReturnType<typeof assembleClientPlanningPackage>)
          : null;
      const packageSnapshot =
        serverPackage ??
        assembleClientPlanningPackage(
          planning,
          form.tipoPlanejamento === "anual" ? form.pacoteTrimestralAnual : "nenhum",
        );
      const trimestresSelecionados = packageSnapshot.trimestres;
      const trimestralPlans = packageSnapshot.trimestrais;

      setGeneratedPlanning(planning);
      setGeneratedTrimestralPlans(trimestralPlans);
      saveAnnualMatrixSnapshot(form, planning);
      setUsedAI(Boolean(data.usedAI));
      const issues = applyQualityFromResponse(data);
      setLastGenerationPayload(payload);
      saveTeachingContextDefaults();

      const qualityContext = {
        qualityScore:
          typeof data.qualityScore === "number" ? data.qualityScore : null,
        qualityIssues: issues,
        serverMaterialId,
      };

      const bundleDocuments =
        trimestresSelecionados.length > 0 && trimestralPlans
          ? buildPlanningBundleDocuments(
              planning,
              trimestresSelecionados,
              payload,
              qualityContext,
              trimestralPlans,
            )
          : null;

      const trimestresExtraidos = trimestresSelecionados
        .map((value) => `${value}º`)
        .join(", ");

      if (abrirEditorAutomatico) {
        if (bundleDocuments && bundleDocuments.length > 1) {
          openPlanningBundleInEditor(bundleDocuments);
          return;
        }

        const html = buildPlanningEditorHtml(form, planning);
        const titulo = planning.titulo || "Planejamento";
        openPlanningInEditor(
          html,
          titulo,
          buildPlanningEditorMeta({
            generationPayload: payload,
            qualityScore: qualityContext.qualityScore,
            qualityIssues: issues,
            serverMaterialId,
          }),
          planning,
        );

        return;
      }

      if (bundleDocuments && bundleDocuments.length > 1) {
        persistPlanningBundleDocuments(bundleDocuments);
      } else {
        persistGeneratedPlanning(planning, payload, {
          qualityScore: data.qualityScore,
          qualityIssues: issues,
          serverMaterialId,
        });
      }

      setStatus(
        trimestresExtraidos
          ? `Planejamento gerado (anual + ${trimestresExtraidos}). Salvo no histórico.`
          : "Planejamento gerado e salvo no histórico. Exporte ao Google Docs ou edite no editor.",
      );
    };

    try {
      await runGeneration(false);
    } catch (err) {
      const code =
        err instanceof Error && "code" in err
          ? String((err as Error & { code?: string }).code || "")
          : "";

      if (code === "daily_limit_reached") {
        try {
          await runGeneration(true);
          return;
        } catch (fallbackErr) {
          dispatchCreditsChangedIfNeeded(fallbackErr);
          const formatted = formatGenerationError(fallbackErr);
          setError(formatted.message);
          setErrorCta(formatted.cta ?? null);
          setErrorRetryable(formatted.retryable);
          setStatus("Erro ao gerar planejamento");
          return;
        }
      }

      dispatchCreditsChangedIfNeeded(err);
      const formatted = formatGenerationError(err);
      setError(formatted.message);
      setErrorCta(formatted.cta ?? null);
      setErrorRetryable(formatted.retryable);
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

      const serverMaterialId =
        typeof data.materialId === "string" && data.materialId.trim()
          ? data.materialId.trim()
          : undefined;

      const planning = data.planejamento as GeneratedPlanning;
      setGeneratedPlanning(planning);
      const elevatePackage = assembleClientPlanningPackage(
        planning,
        form.tipoPlanejamento === "anual" ? form.pacoteTrimestralAnual : "nenhum",
      );
      setGeneratedTrimestralPlans(elevatePackage.trimestrais);
      saveAnnualMatrixSnapshot(form, planning);
      setUsedAI(Boolean(data.usedAI));
      const issues = applyQualityFromResponse(data);
      setLastGenerationPayload(payload);
      saveTeachingContextDefaults();

      persistGeneratedPlanning(planning, payload, {
        qualityScore: data.qualityScore,
        qualityIssues: issues,
        serverMaterialId,
      });

      setStatus("Planejamento atualizado com foco em qualidade.");
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

  function sendToEditor() {
    if (!generatedPlanning) {
      setError("Gere o planejamento antes de enviar para o Editor.");
      return;
    }

    const trimestresSelecionados =
      form.tipoPlanejamento === "anual"
        ? pacoteTrimestralAnualToTrimestres(form.pacoteTrimestralAnual)
        : [];

    if (
      trimestresSelecionados.length > 0 &&
      generatedTrimestralPlans &&
      lastGenerationPayload
    ) {
      const trimestralPlans = generatedTrimestralPlans;
      const qualityContext = {
        qualityScore,
        qualityIssues,
        serverMaterialId: undefined,
      };
      const bundleDocuments = buildPlanningBundleDocuments(
        generatedPlanning,
        trimestresSelecionados,
        lastGenerationPayload,
        qualityContext,
        trimestralPlans,
      );

      if (bundleDocuments.length > 1) {
        const activeIndex = resolveBundleActiveIndex(
          trimestresSelecionados,
          previewMatrizKey,
        );
        openPlanningBundleInEditor(bundleDocuments, activeIndex);
        return;
      }
    }

    const editorForm =
      previewMatrizKey !== "anual" && activePreviewPlanning
        ? {
            ...form,
            tipoPlanejamento: "trimestral" as const,
            trimestre: String(previewMatrizKey),
            cargaHoraria: trimestralCargaHorariaLabel(activePreviewPlanning.conteudos),
          }
        : form;

    const planning = activePreviewPlanning || generatedPlanning;
    const html = buildPlanningEditorHtml(editorForm, planning);
    openPlanningInEditor(
      html,
      planning.titulo || "Planejamento",
      buildPlanningEditorMeta({
        tipoPlanejamento:
          previewMatrizKey === "anual" ? "anual" : "trimestral",
        trimestre:
          previewMatrizKey !== "anual" ? String(previewMatrizKey) : undefined,
      }),
      planning,
    );
  }

  return (
    <PlanifyWorkspacePane>
      <div
        className={
          embeddedInDashboard
            ? "planify-studio-pro space-y-5"
            : "planify-hud pl-hud-hub mx-auto max-w-7xl space-y-5 px-3 sm:px-4 lg:px-0"
        }
      >
        {!embeddedInDashboard ? (
          <div className="pl-hud-page-hero overflow-hidden rounded-2xl border border-cyan-400/15">
            <PlanifyPageHero
              badge="Planejamentos"
              icon="clipboard"
              title="Planejamentos com IA"
              description="Informe os conteúdos, selecione as habilidades BNCC e gere seu planejamento pronto para exportar nos modelos oficiais."
            />
          </div>
        ) : null}

        <PlanningWizardStepper
          step={wizardStep}
          onStepChange={setWizardStep}
          stats={{
            conteudos: stats.conteudos,
            selecionadas: stats.selecionadas,
            matriz: stats.matriz,
          }}
          canGoToStep2={canGoToWizardStep2}
          canGoToStep3={canGoToWizardStep3}
        />

      <section className="space-y-6">
          {wizardStep < 3 ? (
          <>
          <div className="pl-hud-glass rounded-2xl border border-cyan-400/20 p-5 sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600">
              Escolha o tipo
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Planejamento anual ou trimestral
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              Informe os conteúdos, selecione as habilidades e gere o planejamento com IA.
              Exporte ao Google Docs nos modelos oficiais — anual e trimestral na mesma base.
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
              <div className="md:col-span-2">
                <MinhaTurmaChip
                  configured={teachingContext.configured}
                  applied={teachingContext.applied}
                  loading={teachingContext.loading}
                  turmaLabel={teachingContext.context.turma || school.turmaDisplayValue}
                  onApply={() =>
                    teachingContext.applyToForm(applyTeachingContextFields)
                  }
                  onSave={saveTeachingContextDefaults}
                />
              </div>
              <label className="grid gap-2" htmlFor={fieldIdEscola}>
                <span className="text-sm font-bold text-slate-500" id={`${fieldIdEscola}-label`}>
                  Escola
                </span>
                <input
                  id={fieldIdEscola}
                  aria-labelledby={`${fieldIdEscola}-label`}
                  value={form.escola}
                  onChange={(event) => updateField("escola", event.target.value)}
                  placeholder="Nome da escola"
                  className={HUD_FIELD_CLASS}
                />
              </label>
              <label className="grid gap-2" htmlFor={fieldIdProfessor}>
                <span className="text-sm font-bold text-slate-500" id={`${fieldIdProfessor}-label`}>
                  Professor
                </span>
                <input
                  id={fieldIdProfessor}
                  aria-labelledby={`${fieldIdProfessor}-label`}
                  value={form.professor}
                  onChange={(event) => updateField("professor", event.target.value)}
                  placeholder="Nome do professor"
                  className={HUD_FIELD_CLASS}
                />
              </label>
              <label className="grid gap-2" htmlFor={fieldIdEtapa}>
                <span className="text-sm font-bold text-slate-500" id={`${fieldIdEtapa}-label`}>
                  Etapa
                </span>
                <select
                  id={fieldIdEtapa}
                  aria-labelledby={`${fieldIdEtapa}-label`}
                  value={form.etapa}
                  onChange={(event) =>
                    applyEducationFields({ etapa: event.target.value })
                  }
                  className={HUD_FIELD_CLASS}
                >
                  {stageOptions.map((stage) => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2" htmlFor={fieldIdAnoSerie}>
                <span className="text-sm font-bold text-slate-500" id={`${fieldIdAnoSerie}-label`}>
                  Ano/Série
                </span>
                <select
                  id={fieldIdAnoSerie}
                  aria-labelledby={`${fieldIdAnoSerie}-label`}
                  value={form.anoSerie}
                  onChange={(event) =>
                    applyEducationFields({ anoSerie: event.target.value })
                  }
                  className={HUD_FIELD_CLASS}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2" htmlFor={fieldIdArea}>
                <span className="text-sm font-bold text-slate-500" id={`${fieldIdArea}-label`}>
                  Área do conhecimento
                </span>
                <select
                  id={fieldIdArea}
                  aria-labelledby={`${fieldIdArea}-label`}
                  value={form.areaConhecimento}
                  onChange={(event) =>
                    applyEducationFields({ areaConhecimento: event.target.value })
                  }
                  className={HUD_FIELD_CLASS}
                >
                  {areaOptions.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2" htmlFor={fieldIdComponente}>
                <span className="text-sm font-bold text-slate-500" id={`${fieldIdComponente}-label`}>
                  Componente curricular
                </span>
                <select
                  id={fieldIdComponente}
                  aria-labelledby={`${fieldIdComponente}-label`}
                  value={form.componenteCurricular}
                  onChange={(event) =>
                    applyEducationFields({ componente: event.target.value })
                  }
                  className={HUD_FIELD_CLASS}
                >
                  {componentOptions.map((component) => (
                    <option key={component} value={component}>{component}</option>
                  ))}
                </select>
              </label>
              <TurmaCombobox school={school} className="grid gap-2 md:col-span-2" listId="planejamentos-turma-suggestions" />
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

            {form.tipoPlanejamento === "anual" ? (
              <fieldset className="relative z-10 mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-50/40 p-5">
                <legend className="px-1 text-sm font-black text-slate-950">
                  Extrair trimestres do anual
                </legend>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                  Após montar o anual, os trimestres escolhidos são extraídos da mesma
                  matriz — mesmos conteúdos, habilidades e períodos. Não consome créditos
                  extras nem nova geração de IA.
                </p>

                <div className="mt-4 space-y-2">
                  {PACOTE_TRIMESTRAL_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                        form.pacoteTrimestralAnual === option.value
                          ? "border-cyan-500 bg-white shadow-sm"
                          : "border-cyan-400/20 bg-white/80 hover:border-cyan-400/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="pacoteTrimestralAnual"
                        checked={form.pacoteTrimestralAnual === option.value}
                        onChange={() => updateField("pacoteTrimestralAnual", option.value)}
                        className="mt-1 h-4 w-4 border-cyan-400 text-cyan-600 focus:ring-cyan-200"
                      />
                      <span className="text-sm font-semibold text-slate-800">{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : (
              <p className="mt-6 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm font-medium leading-6 text-amber-900">
                Para trimestrais 100% coerentes com o anual, gere o{" "}
                <strong>Planejamento Anual</strong> e escolha a opção de extrair os trimestres
                desejados.
              </p>
            )}

            {wizardStep >= 2 ? (
            <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-white/70 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-600">
                Modelo oficial
              </p>
              <h3 className="mt-3 text-lg font-black text-slate-950">
                Exportação Google Docs com modelos oficiais
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                O Planify preenche exclusivamente os modelos oficiais anual e trimestral
                do Planify. A matriz gerada pela IA é injetada nesses arquivos — sem modelos
                customizados nem layout genérico.
              </p>
            </div>
            ) : null}

            <div className="mt-5 grid gap-5">
              <TemaCombobox
                label="Buscar tema BNCC"
                value={temaBusca}
                onChange={setTemaBusca}
                onSelectSuggestion={handleTemaSuggestionSelect}
                etapa={form.etapa}
                anoSerie={form.anoSerie}
                componente={form.componenteCurricular}
              />

              <label className="grid gap-2" htmlFor={fieldIdConteudos}>
                <span className="text-sm font-bold text-slate-500" id={`${fieldIdConteudos}-label`}>
                  Conteúdos
                </span>
                <textarea
                  id={fieldIdConteudos}
                  aria-labelledby={`${fieldIdConteudos}-label`}
                  value={form.conteudos}
                  onChange={(event) => updateField("conteudos", event.target.value)}
                  rows={6}
                  spellCheck={false}
                  placeholder="Descreva os conteúdos, temas ou unidades que deseja trabalhar no planejamento."
                  className={HUD_SCROLLABLE_TEXTAREA_CLASS}
                  aria-describedby="planejamentos-conteudos-hint"
                />
                <span
                  id="planejamentos-conteudos-hint"
                  className="text-xs text-cyan-700/80"
                >
                  Texto livre — use o formato que preferir. A IA e a BNCC interpretam o conteúdo
                  informado sem reorganizar automaticamente este campo.
                  {conteudosPreenchido ? " (preenchido)" : ""}
                </span>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-500">Objetivos gerais</span>
                <textarea value={form.objetivos} onChange={(event) => updateField("objetivos", event.target.value)} rows={3} placeholder="Opcional. Ajuda no texto pedagógico do planejamento." className={HUD_TEXTAREA_CLASS} />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-500">Observações</span>
                <textarea value={form.observacoes} onChange={(event) => updateField("observacoes", event.target.value)} rows={3} placeholder="Opcional. Informe perfil da turma, foco pedagógico ou necessidades específicas." className={HUD_TEXTAREA_CLASS} />
              </label>
            </div>

            {wizardStep === 1 ? (
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => applyExample("fundamental")}
                  className="pl-hud-btn-secondary rounded-xl px-4 py-2.5 text-sm font-semibold"
                >
                  Exemplo Fundamental
                </button>
                <button
                  type="button"
                  onClick={() => applyExample("medio")}
                  className="pl-hud-btn-secondary rounded-xl px-4 py-2.5 text-sm font-semibold"
                >
                  Exemplo Ensino Médio
                </button>
                <button
                  type="button"
                  disabled={!conteudosPreenchido}
                  onClick={() => setWizardStep(2)}
                  className="pl-hud-btn rounded-xl px-5 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continuar para BNCC
                </button>
              </div>
            ) : null}

            {wizardStep >= 2 ? (
              <>
            {error ? (
              <GenerationErrorBanner
                message={error}
                cta={errorCta}
                retryable={errorRetryable}
                onRetry={() => void generatePlanning()}
                retrying={loadingPlan}
                className="mt-6"
              />
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

            <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <button type="button" onClick={suggestBncc} disabled={loadingBncc} className="pl-hud-btn-secondary rounded-xl px-5 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">
                {loadingBncc ? "Sugerindo BNCC..." : "1. Sugerir BNCC"}
              </button>
              <button
                type="button"
                onClick={() => void generatePlanning()}
                disabled={loadingPlan}
                className="pl-hud-btn-generate rounded-full px-6 py-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingPlan ? "Gerando planejamento..." : "Gerar planejamento com IA"}
              </button>
              <button type="button" onClick={sendToEditor} disabled={!generatedPlanning} className="pl-hud-btn-secondary rounded-xl px-5 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">
                Editar no editor
              </button>
            </div>

            {loadingBncc || loadingPlan ? (
              <PlanningGenerationPanel
                label={
                  loadingBncc
                    ? "Buscando habilidades compatíveis"
                    : "Gerando planejamento com IA"
                }
                context={loadingBncc ? "bncc" : "planejamento"}
              />
            ) : null}
              </>
            ) : null}
          </div>
          </>
          ) : null}

          {wizardStep === 2 ? (
          <div className="pl-hud-glass rounded-2xl p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-600">BNCC por conteúdo</p>
                <h2 className="mt-4 text-3xl font-black text-slate-950">Habilidades sugeridas</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  As sugestões vêm desmarcadas por padrão. Se não concordar com as 3 opções de um
                  conteúdo, use <strong className="text-slate-700">Atualizar habilidades</strong>{" "}
                  naquele bloco.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Pill tone="cyan">{stats.sugeridas} sugeridas</Pill>
                <Pill tone="emerald">{stats.selecionadas} selecionadas</Pill>
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
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void refreshContentBncc(group)}
                          disabled={
                            loadingBncc || refreshingConteudo === group.conteudo
                          }
                          className="rounded-xl border border-cyan-400/30 bg-cyan-50 px-4 py-2 text-xs font-black text-cyan-900 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {refreshingConteudo === group.conteudo
                            ? "Atualizando..."
                            : "Atualizar habilidades"}
                        </button>
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

            {activePreviewPlanning ? (
              <div className="mt-7 rounded-[1.75rem] border border-emerald-200/80 bg-emerald-50/80 p-5">
                {usedAI === false ? (
                  <aside className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                    <p className="font-black">Matriz montada sem IA</p>
                    <p className="mt-1 font-semibold leading-6">
                      A geração por IA não respondeu a tempo ou falhou. Usamos a matriz BNCC
                      automática — revise conteúdos, habilidades e períodos antes de exportar.
                      Gere novamente quando a IA estiver disponível ou use Elevar qualidade após
                      uma geração completa.
                    </p>
                  </aside>
                ) : null}
                {typeof qualityScore === "number" ? (
                  <MaterialQualityScoreBar
                    score={qualityScore}
                    issues={qualityIssues}
                    compact
                    onElevate={
                      lastGenerationPayload && usedAI === true
                        ? () => void elevarQualidadePlanejamento()
                        : undefined
                    }
                    elevating={elevatingQuality}
                  />
                ) : null}
                {generatedTrimestralPlans &&
                Object.keys(generatedTrimestralPlans).length > 0 ? (
                  <div className="mb-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewMatrizKey("anual")}
                      className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                        previewMatrizKey === "anual"
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-slate-700 hover:bg-emerald-100"
                      }`}
                    >
                      Anual
                    </button>
                    {Object.keys(generatedTrimestralPlans)
                      .map(Number)
                      .sort((a, b) => a - b)
                      .map((trimestre) => (
                        <button
                          key={`preview-trim-${trimestre}`}
                          type="button"
                          onClick={() => setPreviewMatrizKey(trimestre as MatrizPreviewKey)}
                          className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                            previewMatrizKey === trimestre
                              ? "bg-emerald-600 text-white"
                              : "bg-white text-slate-700 hover:bg-emerald-100"
                          }`}
                        >
                          {trimestre}º trimestre
                        </button>
                      ))}
                  </div>
                ) : null}
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-600">Matriz gerada</p>
                <h3 className="mt-3 text-2xl font-black text-slate-950">{activePreviewPlanning.titulo}</h3>
                <p className="mt-3 text-sm leading-7 text-emerald-700/90">{activePreviewPlanning.resumo}</p>
                <div className="mt-4 grid gap-2">
                  {activePreviewPlanning.conteudos.map((item: PlanningMatrixItem) => {
                    const numeroAula =
                      Number.isFinite(Number(item.numeroAula)) && Number(item.numeroAula) > 0
                        ? Number(item.numeroAula)
                        : item.aulaInicio;
                    const periodos =
                      Number.isFinite(Number(item.periodos)) && Number(item.periodos) > 0
                        ? Number(item.periodos)
                        : Math.max(1, item.aulaFim - item.aulaInicio + 1);
                    const periodosLabel =
                      periodos === 1 ? "1 período" : `${periodos} período(s)`;

                    return (
                      <div
                        key={`${item.conteudo}-${numeroAula}`}
                        className="rounded-2xl border border-slate-200/80 bg-white/80 p-4"
                      >
                        <p className="font-black text-slate-950">{item.conteudo}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          {Number(item.trimestre) >= 1 && Number(item.trimestre) <= 3
                            ? `${item.trimestre}º trimestre · `
                            : ""}
                          Aula {numeroAula} · {periodosLabel} · {item.habilidades.length} habilidade(s)
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
          ) : null}

          {wizardStep === 3 && generatedPlanning ? (
            <div className="space-y-6">
              <div className="pl-hud-glass rounded-2xl border border-emerald-200/60 p-5 sm:p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-600">
                  Matriz pronta
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
                  Exportar ao Google Docs
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                  Modelos oficiais Planify — anual e trimestral. Revise a matriz abaixo antes de exportar.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={sendToEditor}
                    className="pl-hud-btn-secondary rounded-xl px-5 py-3 text-sm font-semibold"
                  >
                    Editar no editor
                  </button>
                  <MarketplacePublishButton
                    title={activePreviewPlanning?.titulo || generatedPlanning.titulo || "Planejamento"}
                    getHtml={() => {
                      const planning = activePreviewPlanning || generatedPlanning;
                      const editorForm =
                        previewMatrizKey !== "anual"
                          ? {
                              ...form,
                              tipoPlanejamento: "trimestral" as const,
                              trimestre: String(previewMatrizKey),
                              cargaHoraria: trimestralCargaHorariaLabel(planning.conteudos),
                            }
                          : form;
                      return buildPlanningEditorHtml(editorForm, planning);
                    }}
                    getPlanningPayload={() => {
                      const planning = activePreviewPlanning || generatedPlanning;
                      const mode =
                        previewMatrizKey !== "anual" ? ("trimestral" as const) : ("anual" as const);
                      return buildOfficialPlanningPayloadFromGeneration({
                        tipoPlanejamento: mode,
                        escola: form.escola,
                        professor: form.professor,
                        etapa: form.etapa,
                        anoSerie: form.anoSerie,
                        areaConhecimento: form.areaConhecimento,
                        componenteCurricular: form.componenteCurricular,
                        cargaHoraria:
                          mode === "trimestral"
                            ? trimestralCargaHorariaLabel(planning.conteudos)
                            : form.cargaHoraria,
                        trimestre:
                          mode === "trimestral" ? String(previewMatrizKey) : form.trimestre,
                        matrizPlanejamento: planning,
                      });
                    }}
                    tipoMaterial="Planejamento"
                    tema={form.componenteCurricular}
                    componente={form.componenteCurricular}
                    etapa={form.etapa}
                    anoSerie={form.anoSerie}
                  />
                </div>

                {form.tipoPlanejamento === "trimestral" ? (
                  <div className="mt-6 rounded-xl border border-white/80 bg-white/90 px-4 py-3">
                    <PlanningOfficialExportBar
                      title={generatedPlanning.titulo || "Planejamento trimestral"}
                      form={form}
                      mode="trimestral"
                      trimestre={Number(form.trimestre || 1)}
                      matriz={generatedPlanning}
                      qualityScore={qualityScore}
                      qualityIssues={qualityIssues}
                      onStatus={(message) => setStatus(message)}
                    />
                  </div>
                ) : null}

                {form.tipoPlanejamento === "anual" ? (
                  <div className="mt-6 space-y-3">
                    <div className="rounded-xl border border-white/80 bg-white/90 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                        Anual
                      </p>
                      <div className="mt-2">
                        <PlanningOfficialExportBar
                          title={generatedPlanning.titulo || "Planejamento anual"}
                          form={form}
                          mode="anual"
                          matriz={generatedPlanning}
                          qualityScore={qualityScore}
                          qualityIssues={qualityIssues}
                          onStatus={(message) => setStatus(message)}
                        />
                      </div>
                    </div>
                    {trimestresDisponiveisDownload.map((trimestre) => {
                      const trimPlan = generatedTrimestralPlans?.[trimestre];
                      if (!trimPlan) return null;
                      return (
                        <div
                          key={`export-step3-trim-${trimestre}`}
                          className="rounded-xl border border-white/80 bg-white/90 px-4 py-3"
                        >
                          <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                            {trimestre}º trimestre ✓
                          </p>
                          <div className="mt-2">
                            <PlanningOfficialExportBar
                              title={trimPlan.titulo || `${trimestre}º trimestre`}
                              form={form}
                              mode="trimestral"
                              trimestre={trimestre}
                              matriz={trimPlan}
                              qualityScore={qualityScore}
                              qualityIssues={qualityIssues}
                              onStatus={(message) => setStatus(message)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              {activePreviewPlanning ? (
                <div className="pl-hud-glass rounded-2xl border border-emerald-200/50 p-5 sm:p-6">
                  {usedAI === false ? (
                    <aside className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                      <p className="font-black">Matriz montada sem IA</p>
                      <p className="mt-1 font-semibold leading-6">
                        Revise a matriz BNCC automática antes de exportar o DOCX oficial.
                      </p>
                    </aside>
                  ) : null}
                  {typeof qualityScore === "number" ? (
                    <MaterialQualityScoreBar
                      score={qualityScore}
                      issues={qualityIssues}
                      compact
                      onElevate={
                        lastGenerationPayload && usedAI === true
                          ? () => void elevarQualidadePlanejamento()
                          : undefined
                      }
                      elevating={elevatingQuality}
                    />
                  ) : null}
                  {generatedTrimestralPlans &&
                  Object.keys(generatedTrimestralPlans).length > 0 ? (
                    <div className="mb-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewMatrizKey("anual")}
                        className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                          previewMatrizKey === "anual"
                            ? "bg-emerald-600 text-white"
                            : "bg-white text-slate-700 hover:bg-emerald-100"
                        }`}
                      >
                        Anual
                      </button>
                      {Object.keys(generatedTrimestralPlans)
                        .map(Number)
                        .sort((a, b) => a - b)
                        .map((trimestre) => (
                          <button
                            key={`preview-step3-trim-${trimestre}`}
                            type="button"
                            onClick={() => setPreviewMatrizKey(trimestre as MatrizPreviewKey)}
                            className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                              previewMatrizKey === trimestre
                                ? "bg-emerald-600 text-white"
                                : "bg-white text-slate-700 hover:bg-emerald-100"
                            }`}
                          >
                            {trimestre}º trimestre
                          </button>
                        ))}
                    </div>
                  ) : null}
                  <h3 className="text-xl font-black text-slate-950 sm:text-2xl">
                    {activePreviewPlanning.titulo}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {activePreviewPlanning.resumo}
                  </p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {activePreviewPlanning.conteudos.map((item: PlanningMatrixItem) => {
                      const numeroAula =
                        Number.isFinite(Number(item.numeroAula)) && Number(item.numeroAula) > 0
                          ? Number(item.numeroAula)
                          : item.aulaInicio;
                      const periodos =
                        Number.isFinite(Number(item.periodos)) && Number(item.periodos) > 0
                          ? Number(item.periodos)
                          : Math.max(1, item.aulaFim - item.aulaInicio + 1);
                      const periodosLabel =
                        periodos === 1 ? "1 período" : `${periodos} período(s)`;

                      return (
                        <div
                          key={`step3-${item.conteudo}-${numeroAula}`}
                          className="rounded-xl border border-slate-200/80 bg-white/90 p-4"
                        >
                          <p className="font-black text-slate-950">{item.conteudo}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {Number(item.trimestre) >= 1 && Number(item.trimestre) <= 3
                              ? `${item.trimestre}º trimestre · `
                              : ""}
                            Aula {numeroAula} · {periodosLabel} · {item.habilidades.length} habilidade(s)
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </PlanifyWorkspacePane>
  );
}
