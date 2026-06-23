"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type FormState = {
  titulo: string;
  descricao: string;
  etapa: string;
  anoSerie: string;
  componente: string;
  categoria: string;
  autor: string;
  tags: string;
  instrucoes: string;
};

const initialForm: FormState = {
  titulo: "",
  descricao: "",
  etapa: "Ensino Fundamental",
  anoSerie: "",
  componente: "",
  categoria: "Atividade",
  autor: "",
  tags: "",
  instrucoes: "",
};

const etapaOptions = ["Educação Infantil", "Ensino Fundamental", "Ensino Médio"];
const categoriaOptions = [
  "Atividade",
  "Avaliação",
  "Sequência didática",
  "Jogo",
  "Roteiro",
  "Projeto",
];
const componenteOptions = [
  "Língua Portuguesa",
  "Arte",
  "Educação Física",
  "Língua Inglesa",
  "Matemática",
  "Ciências",
  "História",
  "Geografia",
  "Biologia",
  "Física",
  "Química",
  "Filosofia",
  "Sociologia",
  "Multicomponente",
];

function splitTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function getStoredItems() {
  try {
    return JSON.parse(localStorage.getItem("planify_marketplace_items") || "[]");
  } catch {
    return [];
  }
}

export function NewMarketplaceItemClient() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState(
    "Preencha as informações para publicar um material na Comunidade.",
  );

  const tags = useMemo(() => splitTags(form.tags), [form.tags]);
  const canPublish =
    form.titulo.trim().length > 2 &&
    form.descricao.trim().length > 10 &&
    form.anoSerie &&
    form.componente;

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function createPreview() {
    if (!canPublish) {
      setMessage(
        "Preencha título, descrição, ano/série e componente antes de gerar a prévia.",
      );
      return;
    }

    setMessage("Prévia criada. Revise os dados antes de publicar.");
  }

  function publishItem() {
    if (!canPublish) {
      setMessage(
        "Complete os campos obrigatórios antes de publicar o material.",
      );
      return;
    }

    const item = {
      id: crypto.randomUUID(),
      title: form.titulo.trim(),
      description: form.descricao.trim(),
      etapa: form.etapa,
      anoSerie: form.anoSerie,
      componente: form.componente,
      categoria: form.categoria,
      autor: form.autor.trim() || "Professor Planify",
      downloads: 0,
      tags,
      fileName: fileName || undefined,
      instrucoes: form.instrucoes.trim(),
      createdAt: new Date().toISOString(),
    };

    const current = getStoredItems();
    localStorage.setItem(
      "planify_marketplace_items",
      JSON.stringify([item, ...current].slice(0, 100)),
    );

    setMessage(
      "Material publicado localmente. Ele já aparecerá na Comunidade.",
    );
  }

  function clearAll() {
    setForm(initialForm);
    setFileName("");
    setMessage("Campos limpos. Preencha um novo material para publicar.");
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-5 py-10 lg:grid-cols-[0.78fr_1.22fr] sm:px-8">
      <aside className="space-y-6">
        <div className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-6 shadow-2xl shadow-cyan-500/10">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-300">
            Publicação
          </p>
          <h1 className="mt-3 text-sm font-semibold tracking-tight text-white sm:text-base">
            Novo material na Comunidade
          </h1>
          <p className="mt-4 text-sm leading-7 text-cyan-100/80">
            Cadastre um recurso pedagógico, informe tags e anexe o nome do
            arquivo. A publicação local permite validar o fluxo completo antes
            da persistência definitiva no Supabase.
          </p>

          <div className="mt-6 grid gap-3">
            {[
              ["Campos", canPublish ? "Completos" : "Pendentes"],
              ["Tags", String(tags.length)],
              ["Arquivo", fileName || "Não informado"],
              ["Status", "Publicação local"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-slate-950/45 p-4"
              >
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                  {label}
                </p>
                <p className="mt-2 text-sm font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          <Link
            href="/marketplace"
            className="mt-6 flex rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10"
          >
            <span className="w-full">Voltar à Comunidade</span>
          </Link>
        </div>

        <div className="rounded-[1.5rem] border border-cyan-300/20 bg-cyan-300/10 p-5 text-sm leading-7 text-cyan-100">
          <p className="font-black uppercase tracking-[0.2em]">Status</p>
          <p className="mt-2">{message}</p>
        </div>
      </aside>

      <div className="space-y-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-300">
                Dados do material
              </p>
              <h2 className="mt-2 text-sm font-semibold tracking-tight text-white sm:text-base">
                Prepare a publicação com clareza
              </h2>
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
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-bold text-slate-300">Descrição</span>
              <textarea
                value={form.descricao}
                onChange={(event) =>
                  updateField("descricao", event.target.value)
                }
                rows={4}
                placeholder="Explique o objetivo, o uso e o tipo de material."
                className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">Etapa</span>
              <select
                value={form.etapa}
                onChange={(event) => updateField("etapa", event.target.value)}
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none focus:border-cyan-300/50"
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
              <input
                value={form.anoSerie}
                onChange={(event) =>
                  updateField("anoSerie", event.target.value)
                }
                placeholder="Ex.: 5º ano"
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">
                Componente
              </span>
              <select
                value={form.componente}
                onChange={(event) =>
                  updateField("componente", event.target.value)
                }
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none focus:border-cyan-300/50"
              >
                <option value="" className="bg-slate-950">
                  Selecione
                </option>
                {componenteOptions.map((item) => (
                  <option key={item} value={item} className="bg-slate-950">
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">
                Categoria
              </span>
              <select
                value={form.categoria}
                onChange={(event) =>
                  updateField("categoria", event.target.value)
                }
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none focus:border-cyan-300/50"
              >
                {categoriaOptions.map((item) => (
                  <option key={item} value={item} className="bg-slate-950">
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">Autor</span>
              <input
                value={form.autor}
                onChange={(event) => updateField("autor", event.target.value)}
                placeholder="Nome do professor ou escola"
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">Arquivo</span>
              <input
                type="file"
                onChange={(event) =>
                  setFileName(event.target.files?.[0]?.name || "")
                }
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm text-slate-300 outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-white file:px-4 file:py-2 file:text-xs file:font-black file:text-slate-950"
              />
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-bold text-slate-300">Tags</span>
              <input
                value={form.tags}
                onChange={(event) => updateField("tags", event.target.value)}
                placeholder="Ex.: leitura, interpretação, produção textual"
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-bold text-slate-300">
                Instruções de uso
              </span>
              <textarea
                value={form.instrucoes}
                onChange={(event) =>
                  updateField("instrucoes", event.target.value)
                }
                rows={4}
                placeholder="Explique como aplicar o material em sala."
                className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={createPreview}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10"
            >
              Gerar prévia
            </button>

            <button
              type="button"
              onClick={publishItem}
              className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-cyan-100"
            >
              Publicar material
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-6 shadow-2xl shadow-cyan-500/10">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
            Prévia da publicação
          </p>
          <h2 className="mt-2 text-sm font-semibold tracking-tight text-white sm:text-base">
            {form.titulo || "Título do material"}
          </h2>
          <p className="mt-4 text-sm leading-7 text-cyan-100/85">
            {form.descricao ||
              "A descrição aparecerá aqui para conferência antes da publicação."}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {[
              ["Etapa", form.etapa],
              ["Ano/Série", form.anoSerie || "Não informado"],
              ["Componente", form.componente || "Não informado"],
              ["Arquivo", fileName || "Não informado"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
              >
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                  {label}
                </p>
                <p className="mt-2 text-sm font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          {tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-cyan-100"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default NewMarketplaceItemClient;
