"use client";

import Link from "next/link";
import { downloadDocxDocument } from "../../lib/downloads/docx-download-client";
import { useMemo, useState } from "react";

type MaterialType =
  | "atividade"
  | "prova"
  | "apostila"
  | "sequencia"
  | "jogo"
  | "projeto"
  | "roteiro";

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

type GeneratedMaterial = {
  tipo: string;
  titulo: string;
  dadosGerais: {
    escola?: string;
    professor?: string;
    etapa?: string;
    anoSerie?: string;
    componenteCurricular?: string;
    tema?: string;
    duracao?: string;
  };
  introducao?: string;
  orientacoesAluno?: string[];
  secoes?: Array<{
    titulo: string;
    descricao: string;
    itens?: string[];
  }>;
  questoes?: Array<{
    numero: number;
    enunciado: string;
    respostaEsperada?: string;
    criterioCorrecao?: string;
  }>;
  gabarito?: string[];
  jogo?: {
    nome: string;
    objetivo: string;
    materiais: string[];
    preparacao: string[];
    regras: string[];
    modoDeJogar: string[];
  } | null;
  criteriosAvaliacao?: string[];
};

const initialForm: FormState = {
  titulo: "",
  escola: "",
  professor: "",
  etapa: "Ensino Fundamental",
  anoSerie: "",
  areaConhecimento: "",
  componenteCurricular: "",
  tema: "",
  tipo: "atividade",
  quantidadeQuestoes: "10",
  duracao: "",
  objetivos: "",
  conteudos: "",
  orientacoes: "",
  observacoes: "",
};

const exemploAtividade: FormState = {
  titulo: "Atividade de leitura e interpretação",
  escola: "Escola Teste Planify",
  professor: "Professor(a)",
  etapa: "Ensino Fundamental",
  anoSerie: "5º ano",
  areaConhecimento: "",
  componenteCurricular: "Língua Portuguesa",
  tema: "Leitura e interpretação de textos",
  tipo: "atividade",
  quantidadeQuestoes: "10",
  duracao: "2 períodos",
  objetivos: "Desenvolver leitura, interpretação e produção escrita.",
  conteudos:
    "Leitura de texto narrativo\nLocalização de informações explícitas\nInferência de sentidos\nProdução de respostas escritas",
  orientacoes:
    "Ler o texto com atenção, responder com frases completas e revisar a escrita antes de entregar.",
  observacoes: "Turma com foco em reforço de leitura.",
};

const exemploJogo: FormState = {
  titulo: "Jogo pedagógico de revisão matemática",
  escola: "Escola Teste Planify",
  professor: "Professor(a)",
  etapa: "Ensino Fundamental",
  anoSerie: "6º ano",
  areaConhecimento: "",
  componenteCurricular: "Matemática",
  tema: "Operações com números naturais",
  tipo: "jogo",
  quantidadeQuestoes: "",
  duracao: "1 período",
  objetivos:
    "Revisar operações matemáticas por meio de uma dinâmica colaborativa.",
  conteudos:
    "Adição\nSubtração\nMultiplicação\nDivisão\nResolução de problemas",
  orientacoes:
    "Organizar a turma em grupos, explicar as regras e conduzir a socialização das estratégias.",
  observacoes: "Material aplicável em sala, com regras claras e linguagem simples.",
};

const etapaOptions = ["Educação Infantil", "Ensino Fundamental", "Ensino Médio"];

const anoSerieByEtapa: Record<string, string[]> = {
  "Educação Infantil": ["Creche", "Pré-escola"],
  "Ensino Fundamental": [
    "1º ano",
    "2º ano",
    "3º ano",
    "4º ano",
    "5º ano",
    "6º ano",
    "7º ano",
    "8º ano",
    "9º ano",
  ],
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
  "Linguagens e suas Tecnologias": [
    "Língua Portuguesa",
    "Arte",
    "Educação Física",
    "Língua Inglesa",
  ],
  "Matemática e suas Tecnologias": ["Matemática"],
  "Ciências da Natureza e suas Tecnologias": ["Biologia", "Física", "Química"],
  "Ciências Humanas e Sociais Aplicadas": [
    "História",
    "Geografia",
    "Filosofia",
    "Sociologia",
  ],
};

const materialTypes: Array<{
  value: MaterialType;
  label: string;
  description: string;
}> = [
  {
    value: "atividade",
    label: "Atividade",
    description: "Exercícios, comandos e questões orientadas.",
  },
  {
    value: "prova",
    label: "Prova",
    description: "Avaliação com gabarito e critérios de correção.",
  },
  {
    value: "apostila",
    label: "Apostila",
    description: "Explicação didática, exemplos e atividades.",
  },
  {
    value: "sequencia",
    label: "Sequência didática",
    description: "Etapas de aula, mediações e avaliação.",
  },
  {
    value: "jogo",
    label: "Jogo pedagógico",
    description: "Regras, materiais, preparação e dinâmica.",
  },
  {
    value: "projeto",
    label: "Projeto",
    description: "Problema norteador, etapas e produto final.",
  },
  {
    value: "roteiro",
    label: "Roteiro de estudo",
    description: "Orientações para estudo autônomo.",
  },
];

const typeLabels: Record<MaterialType, string> = {
  atividade: "Atividade",
  prova: "Prova",
  apostila: "Apostila",
  sequencia: "Sequência didática",
  jogo: "Jogo pedagógico",
  projeto: "Projeto",
  roteiro: "Roteiro de estudo",
};

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
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
    return form.areaConhecimento
      ? componentesEnsinoMedio[form.areaConhecimento] || []
      : [];
  }

  return componentesByEtapa[form.etapa] || [];
}

function validateForm(form: FormState): string | null {
  if (!form.titulo.trim()) return "Informe o título do material.";
  if (!form.anoSerie) return "Selecione o ano/série.";
  if (isEnsinoMedio(form.etapa) && !form.areaConhecimento) {
    return "Selecione a área do conhecimento.";
  }
  if (!form.componenteCurricular) return "Selecione o componente curricular.";
  if (!form.tema.trim()) return "Informe o tema central.";
  if (splitLines(form.conteudos).length === 0) {
    return "Informe ao menos um conteúdo.";
  }
  if (needsQuestionQuantity(form.tipo) && !form.quantidadeQuestoes.trim()) {
    return "Informe a quantidade de questões para atividade ou prova.";
  }

  return null;
}

function buildFallbackMaterial(form: FormState): GeneratedMaterial {
  const conteudos = splitLines(form.conteudos);
  const quantidade = Number(form.quantidadeQuestoes) || 5;

  return {
    tipo: typeLabels[form.tipo],
    titulo: form.titulo,
    dadosGerais: {
      escola: form.escola,
      professor: form.professor,
      etapa: form.etapa,
      anoSerie: form.anoSerie,
      componenteCurricular: form.componenteCurricular,
      tema: form.tema,
      duracao: form.duracao,
    },
    introducao:
      "Material estruturado para apoiar a prática docente com objetivos claros, organização didática e linguagem adequada à turma.",
    orientacoesAluno: [
      "Leia cada comando com atenção antes de responder.",
      "Registre suas respostas de forma organizada.",
      "Revise sua produção antes de entregar.",
    ],
    secoes: conteudos.map((conteudo, index) => ({
      titulo: `Seção ${index + 1}: ${conteudo}`,
      descricao: `Atividades orientadas para desenvolver o conteúdo "${conteudo}" de forma progressiva e contextualizada.`,
      itens: [
        "Retomada do conhecimento prévio.",
        "Exploração guiada do conteúdo.",
        "Registro individual ou em grupo.",
        "Socialização das respostas.",
      ],
    })),
    questoes: needsQuestionQuantity(form.tipo)
      ? Array.from({ length: quantidade }).map((_, index) => ({
          numero: index + 1,
          enunciado: `Questão ${index + 1}: resolva uma situação relacionada ao tema "${form.tema}".`,
          respostaEsperada:
            "Resposta coerente com o conteúdo estudado, com justificativa clara.",
          criterioCorrecao:
            "Considerar compreensão do comando, organização da resposta e relação com o conteúdo.",
        }))
      : [],
    gabarito: needsQuestionQuantity(form.tipo)
      ? Array.from({ length: quantidade }).map(
          (_, index) => `Questão ${index + 1}: resposta esperada conforme o conteúdo trabalhado.`,
        )
      : [],
    jogo:
      form.tipo === "jogo"
        ? {
            nome: form.titulo,
            objetivo: form.objetivos || `Revisar o tema ${form.tema}.`,
            materiais: [
              "Cartões de perguntas",
              "Quadro ou folha de registro",
              "Marcadores para pontuação",
            ],
            preparacao: [
              "Organizar a turma em grupos.",
              "Explicar as regras antes do início.",
              "Separar os cartões por nível de dificuldade.",
            ],
            regras: [
              "Cada grupo responde em sua vez.",
              "Respostas justificadas valem pontuação maior.",
              "Ao final, a turma revisa coletivamente os principais aprendizados.",
            ],
            modoDeJogar: [
              "Sortear um cartão.",
              "Discutir a resposta no grupo.",
              "Apresentar a solução para a turma.",
              "Registrar estratégias e dúvidas.",
            ],
          }
        : null,
    criteriosAvaliacao: [
      "Participação nas atividades propostas.",
      "Compreensão dos conteúdos trabalhados.",
      "Clareza e organização das respostas.",
      "Capacidade de argumentar e revisar a própria produção.",
    ],
  };
}

function saveToLocalHistory(material: GeneratedMaterial) {
  const item = {
    id: crypto.randomUUID(),
    type: "material",
    title: material.titulo,
    subtitle: `${material.tipo} â€¢ ${material.dadosGerais.componenteCurricular || "Componente não informado"}`,
    createdAt: new Date().toISOString(),
    content: material,
  };

  const key = "planify_history";
  const current = JSON.parse(localStorage.getItem(key) || "[]") as unknown[];
  localStorage.setItem(key, JSON.stringify([item, ...current].slice(0, 50)));
}

async function downloadDocument(material: GeneratedMaterial) {
  await downloadDocxDocument(
    "material",
    material,
    material.titulo || "material-planify",
  );
}

export function MateriaisClient() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<StatusState>({
    type: "idle",
    message: "Aguardando preenchimento.",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMaterial, setGeneratedMaterial] =
    useState<GeneratedMaterial | null>(null);

  const conteudos = useMemo(() => splitLines(form.conteudos), [form.conteudos]);
  const componentesDisponiveis = useMemo(
    () => getComponentesDisponiveis(form),
    [form],
  );

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => {
      const next = {
        ...current,
        [key]: value,
      };

      if (key === "etapa") {
        next.anoSerie = "";
        next.areaConhecimento = "";
        next.componenteCurricular = "";
      }

      if (key === "areaConhecimento") {
        next.componenteCurricular = "";
      }

      if (key === "tipo" && value === "jogo") {
        next.quantidadeQuestoes = "";
      }

      if (key === "tipo" && value !== "jogo" && !next.quantidadeQuestoes) {
        next.quantidadeQuestoes = "10";
      }

      return next;
    });
  }

  function clearAll() {
    setForm(initialForm);
    setGeneratedMaterial(null);
    setStatus({
      type: "idle",
      message: "Campos limpos. Preencha os dados para gerar um novo material.",
    });
  }

  function applyExample(type: "atividade" | "jogo") {
    setForm(type === "atividade" ? exemploAtividade : exemploJogo);
    setGeneratedMaterial(null);
    setStatus({
      type: "info",
      message:
        type === "atividade"
          ? "Exemplo de atividade aplicado."
          : "Exemplo de jogo aplicado. Jogo pedagógico não exige quantidade de questões.",
    });
  }

  async function generateMaterial() {
    const validation = validateForm(form);

    if (validation) {
      setStatus({
        type: "error",
        message: validation,
      });
      return;
    }

    setIsGenerating(true);
    setStatus({
      type: "info",
      message: "Gerando material didático com IA...",
    });

    try {
      const response = await fetch("/api/ai/material", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error?.message ||
            result?.message ||
            "Não foi possível gerar material com IA agora.",
        );
      }

      const material = (result.data || result.material) as GeneratedMaterial;
      setGeneratedMaterial(material);
      saveToLocalHistory(material);
      setStatus({
        type: "success",
        message:
          "Material gerado com IA. Você pode revisar, baixar ou enviar para o Editor.",
      });
    } catch (error) {
      const fallback = buildFallbackMaterial(form);
      setGeneratedMaterial(fallback);
      saveToLocalHistory(fallback);
      setStatus({
        type: "success",
        message:
          error instanceof Error
            ? `A IA não respondeu agora. Uma versão estruturada foi criada para não interromper seu fluxo. Detalhe: ${error.message}`
            : "Uma versão estruturada foi criada para não interromper seu fluxo.",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  function openInEditor() {
    if (!generatedMaterial) {
      return;
    }

    localStorage.setItem("planify_editor_document", JSON.stringify(generatedMaterial));
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
          <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-300">
            IA pedagógica
          </p>
          <h1 className="mt-4 text-3xl font-black text-white">
            Materiais com IA
          </h1>
          <p className="mt-4 text-sm leading-7 text-cyan-100/80">
            Gere atividades, avaliações, apostilas, sequências didáticas,
            projetos, roteiros ou jogos com linguagem adequada à etapa e ao
            componente curricular.
          </p>

          <div className="mt-6 grid gap-3">
            {[
              ["Tipo", typeLabels[form.tipo]],
              ["Conteúdos", String(conteudos.length)],
              [
                "Questões",
                needsQuestionQuantity(form.tipo)
                  ? form.quantidadeQuestoes || "0"
                  : "Não se aplica",
              ],
              ["IA", isGenerating ? "Gerando" : "Aguardando"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-slate-950/45 p-4"
              >
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                  {label}
                </p>
                <p className="mt-2 text-2xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3">
            <button
              type="button"
              onClick={() => applyExample("atividade")}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10"
            >
              Exemplo de atividade
            </button>
            <button
              type="button"
              onClick={() => applyExample("jogo")}
              className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 text-sm font-black text-cyan-100 transition hover:-translate-y-1 hover:bg-cyan-300/20"
            >
              Exemplo de jogo pedagógico
            </button>
          </div>
        </div>

        <div className={`rounded-[1.5rem] border p-5 text-sm leading-7 ${statusClass}`}>
          <p className="font-black uppercase tracking-[0.2em]">Status</p>
          <p className="mt-2">{status.message}</p>
        </div>
      </aside>

      <div className="space-y-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-300">
                Dados
              </p>
              <h2 className="mt-3 text-3xl font-black text-white">
                Informações do material
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                Quanto mais claro for o preenchimento, melhor será o resultado
                pedagógico gerado.
              </p>
            </div>

            <button
              type="button"
              onClick={clearAll}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10"
            >
              Limpar tudo
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-bold text-slate-300">Título</span>
              <input
                value={form.titulo}
                onChange={(event) => updateField("titulo", event.target.value)}
                placeholder="Ex.: Atividade de leitura e interpretação"
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">Escola</span>
              <input
                value={form.escola}
                onChange={(event) => updateField("escola", event.target.value)}
                placeholder="Nome da escola"
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">Professor</span>
              <input
                value={form.professor}
                onChange={(event) =>
                  updateField("professor", event.target.value)
                }
                placeholder="Nome do professor"
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">Etapa</span>
              <select
                value={form.etapa}
                onChange={(event) => updateField("etapa", event.target.value)}
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition focus:border-cyan-300/50"
              >
                {etapaOptions.map((item) => (
                  <option key={item} value={item} className="bg-slate-950">
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">
                Ano/Série
              </span>
              <select
                value={form.anoSerie}
                onChange={(event) =>
                  updateField("anoSerie", event.target.value)
                }
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition focus:border-cyan-300/50"
              >
                <option value="" className="bg-slate-950">
                  Selecione
                </option>
                {(anoSerieByEtapa[form.etapa] || []).map((item) => (
                  <option key={item} value={item} className="bg-slate-950">
                    {item}
                  </option>
                ))}
              </select>
            </label>

            {isEnsinoMedio(form.etapa) && (
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-300">
                  Área do conhecimento
                </span>
                <select
                  value={form.areaConhecimento}
                  onChange={(event) =>
                    updateField("areaConhecimento", event.target.value)
                  }
                  className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition focus:border-cyan-300/50"
                >
                  <option value="" className="bg-slate-950">
                    Selecione
                  </option>
                  {areasEnsinoMedio.map((item) => (
                    <option key={item} value={item} className="bg-slate-950">
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">
                Componente curricular
              </span>
              <select
                value={form.componenteCurricular}
                onChange={(event) =>
                  updateField("componenteCurricular", event.target.value)
                }
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition focus:border-cyan-300/50"
              >
                <option value="" className="bg-slate-950">
                  {isEnsinoMedio(form.etapa) && !form.areaConhecimento
                    ? "Selecione a área primeiro"
                    : "Selecione"}
                </option>
                {componentesDisponiveis.map((item) => (
                  <option key={item} value={item} className="bg-slate-950">
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">Tema</span>
              <input
                value={form.tema}
                onChange={(event) => updateField("tema", event.target.value)}
                placeholder="Ex.: Leitura e interpretação de textos"
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">
                Tipo de material
              </span>
              <select
                value={form.tipo}
                onChange={(event) =>
                  updateField("tipo", event.target.value as MaterialType)
                }
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition focus:border-cyan-300/50"
              >
                {materialTypes.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                    className="bg-slate-950"
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            {needsQuestionQuantity(form.tipo) && (
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-300">
                  Quantidade de questões
                </span>
                <input
                  value={form.quantidadeQuestoes}
                  onChange={(event) =>
                    updateField("quantidadeQuestoes", event.target.value)
                  }
                  placeholder="Ex.: 10"
                  className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                />
              </label>
            )}

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">
                Duração sugerida
              </span>
              <input
                value={form.duracao}
                onChange={(event) => updateField("duracao", event.target.value)}
                placeholder="Ex.: 2 períodos"
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </label>

            {form.tipo === "jogo" && (
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm leading-7 text-cyan-100 md:col-span-2">
                <span className="font-black">Jogo pedagógico:</span> este tipo
                não exige quantidade de questões. O resultado deve trazer
                objetivo, materiais, preparação, regras e modo de jogar.
              </div>
            )}

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-bold text-slate-300">Conteúdos</span>
              <textarea
                value={form.conteudos}
                onChange={(event) =>
                  updateField("conteudos", event.target.value)
                }
                rows={5}
                placeholder={
                  "Digite um conteúdo por linha.\nEx.: Localização de informações explícitas\nEx.: Inferência de sentidos"
                }
                className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-bold text-slate-300">Objetivos</span>
              <textarea
                value={form.objetivos}
                onChange={(event) =>
                  updateField("objetivos", event.target.value)
                }
                rows={3}
                placeholder="Objetivos pedagógicos do material"
                className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-bold text-slate-300">
                Orientações
              </span>
              <textarea
                value={form.orientacoes}
                onChange={(event) =>
                  updateField("orientacoes", event.target.value)
                }
                rows={3}
                placeholder="Instruções, formato desejado ou orientação para execução"
                className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-bold text-slate-300">
                Observações
              </span>
              <textarea
                value={form.observacoes}
                onChange={(event) =>
                  updateField("observacoes", event.target.value)
                }
                rows={3}
                placeholder="Características da turma, adaptações ou necessidades específicas"
                className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={generateMaterial}
              disabled={isGenerating}
              className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? "Gerando..." : "Gerar material"}
            </button>

            <Link
              href="/historico"
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10"
            >
              Ver histórico
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl">
          {generatedMaterial ? (
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
                Prévia
              </p>
              <h2 className="mt-3 text-3xl font-black text-white">
                {generatedMaterial.titulo}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                {generatedMaterial.introducao}
              </p>

              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                  <p className="text-sm font-black text-cyan-200">
                    Orientações ao aluno
                  </p>
                  <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-300">
                    {(generatedMaterial.orientacoesAluno || []).map((item) => (
                      <li key={item}>â€¢ {item}</li>
                    ))}
                  </ul>
                </div>

                {(generatedMaterial.secoes || []).map((section, index) => (
                  <div
                    key={`${section.titulo}-${index}`}
                    className="rounded-2xl border border-white/10 bg-slate-950/50 p-5"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                      Seção {index + 1}
                    </p>
                    <h3 className="mt-2 text-xl font-black text-white">
                      {section.titulo}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-400">
                      {section.descricao}
                    </p>
                    {section.itens && (
                      <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-300">
                        {section.itens.map((item) => (
                          <li key={item}>â€¢ {item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}

                {(generatedMaterial.questoes || []).length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                    <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
                      Questões
                    </p>
                    <div className="mt-4 grid gap-4">
                      {(generatedMaterial.questoes || []).map((question) => (
                        <div key={question.numero} className="text-sm text-slate-300">
                          <p className="font-black text-white">
                            {question.numero}. {question.enunciado}
                          </p>
                          {question.respostaEsperada && (
                            <p className="mt-2 text-slate-400">
                              Resposta esperada: {question.respostaEsperada}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {generatedMaterial.jogo && (
                  <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5">
                    <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-200">
                      Jogo pedagógico
                    </p>
                    <h3 className="mt-2 text-xl font-black text-white">
                      {generatedMaterial.jogo.nome}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-cyan-100/80">
                      {generatedMaterial.jogo.objetivo}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={openInEditor}
                  className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-cyan-100"
                >
                  Abrir no Editor
                </button>
                <button
                  type="button"
                  onClick={() => downloadDocument(generatedMaterial)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10"
                >
                  Baixar DOCX
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
                Prévia
              </p>
              <h2 className="mt-3 text-3xl font-black text-white">
                Aguardando geração com IA
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                Preencha os dados do material, informe conteúdos claros e clique
                em gerar. A prévia aparecerá aqui antes de abrir no Editor.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default MateriaisClient;
