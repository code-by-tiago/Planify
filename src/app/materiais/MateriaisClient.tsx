"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
import {
  createEditorDocument,
  saveEditorDocument,
} from "../../lib/editor/editor-storage";
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
};

type StatusState = {
  type: "idle" | "info" | "success" | "error";
  message: string;
};

type BnccSuggestion = MaterialGeneratorBNCCSkill & {
  id?: string;
  texto?: string;
  label?: string;
  score?: number;
};

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
  quantidadeQuestoes: "8",
  tiposQuestao: ["discursiva", "multipla_escolha", "analise_contextualizada"],
  gerarGabarito: true,
  gerarVersaoProfessor: true,
  recursosDisponiveis: "Quadro, caderno, impressão e projetor quando disponível",
  inclusaoAcessibilidade: "Linguagem clara e instruções objetivas",
  tomLinguagem: "claro, profissional e adequado à turma",
  observacoes: "",
};

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
  EJA: [
    "Língua Portuguesa",
    "Matemática",
    "Ciências",
    "História",
    "Geografia",
    "Arte",
    "Educação Física",
    "Língua Inglesa",
  ],
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

function fieldBase() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100";
}

function labelBase() {
  return "text-xs font-black uppercase tracking-[0.18em] text-slate-500";
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

function buildFallbackPreview(material: PlanifyGeneratedMaterial): string {
  const sections = (material.secoes || [])
    .map((section) => {
      const blocks = (section.conteudo || [])
        .map((block) => `<p>${block.texto}</p>`)
        .join("");
      return `<h2>${section.titulo}</h2>${blocks}`;
    })
    .join("");

  return `<article><h1>${material.titulo}</h1><p>${material.resumo}</p>${sections}</article>`;
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
  const [creditMessage, setCreditMessage] = useState<string>("");

  const creditCost = useMemo(
    () => getMaterialCreditCost(form.tipoMaterial, form.tamanho),
    [form.tipoMaterial, form.tamanho],
  );

  const availableYears = anoSerieByEtapa[form.etapaEnsino] || anoSerieByEtapa["Ensino Fundamental"];
  const availableComponents = componentesByEtapa[form.etapaEnsino] || componentesByEtapa["Ensino Fundamental"];
  const needsQuestions = materialTypeNeedsQuestions(form.tipoMaterial);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
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
  }

  function toggleQuestionType(value: MaterialGeneratorQuestionType) {
    setForm((current) => {
      const exists = current.tiposQuestao.includes(value);
      const tiposQuestao = exists
        ? current.tiposQuestao.filter((item) => item !== value)
        : [...current.tiposQuestao, value];

      return {
        ...current,
        tiposQuestao,
      };
    });
  }

  function toggleBncc(skill: MaterialGeneratorBNCCSkill) {
    setSelectedBncc((current) => {
      const exists = current.some((item) => sameSkill(item, skill));
      if (exists) return current.filter((item) => !sameSkill(item, skill));
      return [...current, skill];
    });
  }

  function validateForm(): string | null {
    if (!form.tipoMaterial) return "Selecione o tipo de material.";
    if (!form.etapaEnsino) return "Selecione a etapa.";
    if (!form.anoSerie) return "Selecione o ano/série.";
    if (!form.componenteCurricular) return "Selecione o componente curricular.";
    if (!form.temaCentral.trim()) return "Informe o tema central.";
    if (needsQuestions && !form.quantidadeQuestoes.trim()) return "Informe a quantidade de questões/exercícios.";
    return null;
  }

  async function suggestBncc() {
    const error = validateForm();
    if (error) {
      setStatus({ type: "error", message: error });
      return;
    }

    setBnccLoading(true);
    setStatus({ type: "info", message: "Buscando habilidades BNCC oficiais compatíveis com o tema." });

    try {
      const response = await fetch("/api/bncc/sugerir", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

      if (!response.ok || json.success === false) {
        throw new Error(json?.error?.message || "Não foi possível sugerir BNCC.");
      }

      const rawItems = (json.habilidades || json.sugeridas || json.skills || json.items || []) as BnccSuggestion[];
      const normalized = rawItems
        .map(normalizeBnccSuggestion)
        .filter((item): item is MaterialGeneratorBNCCSkill => Boolean(item));
      const unique = normalized.filter(
        (item, index, array) => array.findIndex((other) => sameSkill(other, item)) === index,
      );

      setBnccSuggestions(unique);
      setSelectedBncc(unique.slice(0, 3));
      setStatus({
        type: unique.length ? "success" : "info",
        message: unique.length
          ? `Foram encontradas ${unique.length} habilidade(s). Selecione apenas as que deseja usar.`
          : "Nenhuma habilidade foi encontrada para esse recorte. O material será gerado sem inventar BNCC.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Erro ao sugerir BNCC.",
      });
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

    setGenerating(true);
    setMaterial(null);
    setCreditMessage("");
    setStatus({
      type: "info",
      message: "Gerando material com IA e validando a estrutura para edição, Word e PDF.",
    });

    try {
      const response = await fetch("/api/materiais/gerar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          quantidadeQuestoes: Number(form.quantidadeQuestoes) || 0,
          habilidadesBncc: selectedBncc,
          idempotencyKey:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `material_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        }),
      });

      const json = (await response.json()) as MaterialGenerationResponse | { success: false; error?: { message?: string; details?: string } };

      if (!response.ok || !json.success) {
        const errorPayload = !json.success ? json.error : null;
        throw new Error(errorPayload?.message || errorPayload?.details || "Não foi possível gerar o material.");
      }

      setMaterial(json.data.material);
      setCreditMessage(json.data.credit.message);
      setStatus({
        type: "success",
        message: json.data.duplicate
          ? "Material recuperado sem consumir créditos duplicados."
          : "Material gerado com sucesso. Você já pode abrir no editor, baixar em Word ou imprimir em PDF.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Erro ao gerar material.",
      });
    } finally {
      setGenerating(false);
    }
  }

  function openInEditor() {
    if (!material) return;

    const document = createEditorDocument({
      source: "material",
      title: materialTitle(material),
      subtitle: materialSubtitle(material),
      type: material.tipo || form.tipoMaterial,
      content: material.htmlEditor || buildFallbackPreview(material),
      raw: material,
    });

    saveEditorDocument(document);
    window.location.href = "/editor";
  }

  async function downloadWord() {
    if (!material) return;

    try {
      await downloadDocxDocument("material", material, materialTitle(material));
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Não foi possível baixar o Word.",
      });
    }
  }

  function printPdf() {
    window.print();
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

  const previewHtml = material ? sanitizePreviewHtml(material.htmlEditor || buildFallbackPreview(material)) : "";

  return (
    <main className="space-y-8 text-slate-950">
      <section className="overflow-hidden rounded-[2rem] border border-cyan-100 bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900 p-6 text-white shadow-2xl shadow-cyan-950/20 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">Gerador IA de Materiais Didáticos</p>
            <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-tight md:text-5xl">
              Materiais prontos para sala, com esforço zero para o professor.
            </h1>
            <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-cyan-50/90 md:text-base">
              Escolha tipo, turma, componente e tema. O Planify organiza a estrutura, respeita o formato do material, separa versão do aluno e gabarito, abre no editor e permite exportar.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 shadow-xl backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100">Custo estimado</p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-4xl font-black">{creditCost}</p>
                <p className="text-sm font-bold text-cyan-100">créditos nesta geração</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 text-right text-slate-950">
                <p className="text-xs font-black uppercase text-slate-500">Tipo</p>
                <p className="text-sm font-black">{getMaterialTypeLabel(form.tipoMaterial)}</p>
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
            <button
              type="button"
              onClick={clearAll}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              Limpar tudo
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className={labelBase()}>Tipo de material</span>
              <select
                className={fieldBase()}
                value={form.tipoMaterial}
                onChange={(event) => update("tipoMaterial", event.target.value as MaterialGeneratorType)}
              >
                {MATERIAL_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className={labelBase()}>Etapa</span>
              <select className={fieldBase()} value={form.etapaEnsino} onChange={(event) => updateEtapa(event.target.value)}>
                {etapaOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>

            <label className="space-y-2">
              <span className={labelBase()}>Ano/Série</span>
              <select className={fieldBase()} value={form.anoSerie} onChange={(event) => update("anoSerie", event.target.value)}>
                {availableYears.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>

            {form.etapaEnsino === "Ensino Médio" ? (
              <label className="space-y-2 md:col-span-2">
                <span className={labelBase()}>Área do conhecimento</span>
                <select className={fieldBase()} value={form.areaConhecimento} onChange={(event) => update("areaConhecimento", event.target.value)}>
                  {areasEnsinoMedio.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
            ) : null}

            <label className="space-y-2 md:col-span-2">
              <span className={labelBase()}>Componente curricular</span>
              <select className={fieldBase()} value={form.componenteCurricular} onChange={(event) => update("componenteCurricular", event.target.value)}>
                {availableComponents.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className={labelBase()}>Tema central</span>
              <input
                className={fieldBase()}
                value={form.temaCentral}
                onChange={(event) => update("temaCentral", event.target.value)}
                placeholder="Ex.: Amazônia, frações, Revolução Industrial, energia elétrica..."
              />
            </label>

            <label className="space-y-2">
              <span className={labelBase()}>Objetivo</span>
              <select className={fieldBase()} value={form.objetivo} onChange={(event) => update("objetivo", event.target.value)}>
                {objetivoOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>

            <label className="space-y-2">
              <span className={labelBase()}>Tamanho</span>
              <select className={fieldBase()} value={form.tamanho} onChange={(event) => update("tamanho", event.target.value as MaterialGeneratorSize)}>
                {MATERIAL_SIZE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>

            <label className="space-y-2">
              <span className={labelBase()}>Dificuldade</span>
              <select className={fieldBase()} value={form.nivelDificuldade} onChange={(event) => update("nivelDificuldade", event.target.value)}>
                {difficultyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>

            <label className="space-y-2">
              <span className={labelBase()}>{needsQuestions ? "Questões/Exercícios" : "Questões complementares"}</span>
              <input
                className={fieldBase()}
                type="number"
                min={0}
                max={60}
                value={form.quantidadeQuestoes}
                onChange={(event) => update("quantidadeQuestoes", event.target.value)}
                disabled={!needsQuestions && form.tipoMaterial !== "apostila"}
              />
            </label>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
            <button
              type="button"
              onClick={() => setAdvancedOpen((value) => !value)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <span>
                <span className={labelBase()}>Campos avançados</span>
                <strong className="mt-1 block text-lg font-black">BNCC, gabarito, acessibilidade e recursos</strong>
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-slate-700 shadow-sm">{advancedOpen ? "Fechar" : "Abrir"}</span>
            </button>

            {advancedOpen ? (
              <div className="mt-5 space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="space-y-2">
                    <span className={labelBase()}>Escola</span>
                    <input className={fieldBase()} value={form.escola} onChange={(event) => update("escola", event.target.value)} />
                  </label>
                  <label className="space-y-2">
                    <span className={labelBase()}>Professor</span>
                    <input className={fieldBase()} value={form.professor} onChange={(event) => update("professor", event.target.value)} />
                  </label>
                  <label className="space-y-2">
                    <span className={labelBase()}>Turma</span>
                    <input className={fieldBase()} value={form.turma} onChange={(event) => update("turma", event.target.value)} />
                  </label>
                </div>

                <div>
                  <span className={labelBase()}>Tipos de questão</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {questionTypeOptions.map((option) => {
                      const selected = form.tiposQuestao.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleQuestionType(option.value)}
                          className={`rounded-full border px-3 py-2 text-xs font-black transition ${selected ? "border-cyan-500 bg-cyan-50 text-cyan-800" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200"}`}
                        >
                          {selected ? "✓ " : "+ "}{option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <span>
                      <span className="block text-sm font-black">Gerar gabarito</span>
                      <span className="text-xs font-semibold text-slate-500">Separado da versão do aluno.</span>
                    </span>
                    <input type="checkbox" checked={form.gerarGabarito} onChange={(event) => update("gerarGabarito", event.target.checked)} />
                  </label>

                  <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <span>
                      <span className="block text-sm font-black">Versão do professor</span>
                      <span className="text-xs font-semibold text-slate-500">Com critérios e sugestões.</span>
                    </span>
                    <input type="checkbox" checked={form.gerarVersaoProfessor} onChange={(event) => update("gerarVersaoProfessor", event.target.checked)} />
                  </label>
                </div>

                <label className="space-y-2">
                  <span className={labelBase()}>Recursos disponíveis</span>
                  <input className={fieldBase()} value={form.recursosDisponiveis} onChange={(event) => update("recursosDisponiveis", event.target.value)} />
                </label>

                <label className="space-y-2">
                  <span className={labelBase()}>Inclusão e acessibilidade</span>
                  <input className={fieldBase()} value={form.inclusaoAcessibilidade} onChange={(event) => update("inclusaoAcessibilidade", event.target.value)} />
                </label>

                <label className="space-y-2">
                  <span className={labelBase()}>Observações do professor</span>
                  <textarea className={`${fieldBase()} min-h-28`} value={form.observacoes} onChange={(event) => update("observacoes", event.target.value)} placeholder="Ex.: turma com dificuldade de leitura, material para recuperação, evitar atividade em grupo..." />
                </label>
              </div>
            ) : null}
          </div>

          <div className="rounded-[1.5rem] border border-cyan-100 bg-cyan-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className={labelBase()}>BNCC oficial</p>
                <h3 className="text-lg font-black">Habilidades selecionáveis</h3>
                <p className="mt-1 text-sm font-semibold text-slate-600">O material só usa as habilidades marcadas aqui. Se nenhuma for marcada, a IA não inventa BNCC.</p>
              </div>
              <button
                type="button"
                onClick={suggestBncc}
                disabled={bnccLoading || generating}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/20 transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {bnccLoading ? "Buscando..." : "Sugerir BNCC"}
              </button>
            </div>

            {bnccSuggestions.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {bnccSuggestions.map((skill) => {
                  const selected = selectedBncc.some((item) => sameSkill(item, skill));
                  return (
                    <button
                      key={`${skill.codigo}-${skill.descricao}`}
                      type="button"
                      onClick={() => toggleBncc(skill)}
                      className={`rounded-2xl border p-4 text-left transition ${selected ? "border-cyan-400 bg-white shadow-md shadow-cyan-500/10" : "border-slate-200 bg-white/70 hover:border-cyan-200"}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">{skill.codigo}</span>
                          <p className="mt-3 text-sm font-bold leading-6 text-slate-800">{skill.descricao}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${selected ? "bg-cyan-100 text-cyan-800" : "bg-slate-100 text-slate-500"}`}>{selected ? "Usando" : "Usar"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          {status.type !== "idle" ? (
            <div className={`rounded-2xl border p-4 text-sm font-bold leading-6 ${status.type === "error" ? "border-red-200 bg-red-50 text-red-700" : status.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-blue-200 bg-blue-50 text-blue-800"}`}>
              {status.message}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={generateMaterial}
              disabled={generating || bnccLoading}
              className="flex-1 rounded-2xl bg-gradient-to-r from-cyan-600 to-emerald-600 px-5 py-4 text-sm font-black text-white shadow-xl shadow-cyan-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generating ? "Gerando material..." : `Gerar material • ${creditCost} créditos`}
            </button>
            <Link href="/dashboard" className="rounded-2xl border border-slate-200 px-5 py-4 text-center text-sm font-black text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50">
              Voltar
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          {generating ? (
            <div className="rounded-[2rem] border border-cyan-200 bg-white p-6 shadow-xl shadow-cyan-950/10">
              <p className={labelBase()}>Criação em andamento</p>
              <h2 className="mt-2 text-2xl font-black">O Planify está montando o material no formato certo.</h2>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {["Analisando tipo de material", "Separando versão do aluno e professor", "Conferindo BNCC selecionada", "Preparando HTML editável"].map((item, index) => (
                  <div key={item} className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                    <div className="h-1.5 overflow-hidden rounded-full bg-white">
                      <span className="block h-full animate-pulse rounded-full bg-cyan-500" style={{ width: `${45 + index * 12}%` }} />
                    </div>
                    <p className="mt-3 text-sm font-black text-slate-800">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {material ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/5 md:p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className={labelBase()}>Material gerado</p>
                  <h2 className="mt-2 text-2xl font-black">{materialTitle(material)}</h2>
                  <p className="mt-2 text-sm font-bold text-slate-500">{materialSubtitle(material)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={openInEditor} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-cyan-800">Abrir no Editor</button>
                  <button type="button" onClick={downloadWord} className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-black text-cyan-800 transition hover:bg-cyan-100">Baixar Word</button>
                  <button type="button" onClick={printPdf} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">PDF/Imprimir</button>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase text-slate-500">Tipo</p>
                  <p className="mt-1 font-black">{material.tipo}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase text-slate-500">Questões</p>
                  <p className="mt-1 font-black">{material.questoes?.length || 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase text-slate-500">BNCC</p>
                  <p className="mt-1 font-black">{material.metadata.bncc?.length || 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase text-slate-500">Créditos</p>
                  <p className="mt-1 font-black">{material.metadata.creditCost || creditCost}</p>
                </div>
              </div>

              <div className="planify-material-preview mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-5 text-slate-900 shadow-inner">
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center shadow-xl shadow-slate-950/5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Prévia</p>
              <h2 className="mt-3 text-2xl font-black">Seu material aparecerá aqui</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-7 text-slate-500">
                O novo motor foi separado de Planejamentos para evitar mistura de formatos. Apostila será apostila, prova será prova, atividade será atividade e jogo só será gerado quando for escolhido.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
