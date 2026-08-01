"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

function buildDescription(form: FormState): string {
  const parts = [form.descricao.trim()];
  if (form.instrucoes.trim()) {
    parts.push(`Instruções de uso: ${form.instrucoes.trim()}`);
  }
  return parts.filter(Boolean).join("\n\n");
}

export function NewMarketplaceItemClient() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [file, setFile] = useState<File | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState(
    "Preencha as informações e anexe um arquivo para publicar na Comunidade.",
  );

  const tags = useMemo(() => splitTags(form.tags), [form.tags]);
  const canPublish =
    form.titulo.trim().length > 2 &&
    form.descricao.trim().length > 10 &&
    form.anoSerie &&
    form.componente &&
    Boolean(file);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function createPreview() {
    if (!canPublish) {
      setMessage(
        "Preencha título, descrição, ano/série, componente e anexe um arquivo antes de gerar a prévia.",
      );
      return;
    }

    setMessage("Prévia criada. Revise os dados antes de publicar.");
  }

  async function publishItem() {
    if (!canPublish || !file) {
      setMessage(
        "Complete os campos obrigatórios e anexe um arquivo antes de publicar.",
      );
      return;
    }

    setPublishing(true);
    setMessage("Publicando material na Comunidade...");

    try {
      const description = buildDescription(form);
      const body = new FormData();
      body.set("title", form.titulo.trim());
      body.set("description", description);
      body.set("etapa", form.etapa);
      body.set("anoSerie", form.anoSerie);
      body.set("componente", form.componente);
      body.set("tipoMaterial", form.categoria);
      body.set("tema", form.titulo.trim());
      body.set("tags", tags.join(", "));
      body.set("authorName", form.autor.trim() || "Professor Planify");
      body.set("isPublished", "true");
      body.set("file", file);

      const response = await fetch("/api/marketplace/materiais", {
        method: "POST",
        body,
        credentials: "include",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error?.message || "Não foi possível publicar o material.");
      }

      const materialId = String(data?.item?.id || "").trim();
      setMessage("Material publicado com sucesso na Comunidade.");

      if (materialId) {
        router.push(`/comunidade/material/${materialId}`);
        return;
      }

      router.push("/comunidade");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível publicar o material.",
      );
    } finally {
      setPublishing(false);
    }
  }

  function clearAll() {
    setForm(initialForm);
    setFile(null);
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
            Cadastre um recurso pedagógico, informe tags e anexe o arquivo. A
            publicação é salva no Supabase e fica visível para professores com
            plano ativo.
          </p>

          <div className="mt-6 grid gap-3">
            {[
              ["Campos", canPublish ? "Completos" : "Pendentes"],
              ["Tags", String(tags.length)],
              ["Arquivo", file?.name || "Não informado"],
              ["Status", publishing ? "Publicando..." : "Pronto para enviar"],
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
              disabled={publishing}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10 disabled:opacity-60"
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
                required
                accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.html,.htm"
                onChange={(event) =>
                  setFile(event.target.files?.[0] || null)
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
              disabled={publishing}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10 disabled:opacity-60"
            >
              Gerar prévia
            </button>

            <button
              type="button"
              onClick={() => void publishItem()}
              disabled={publishing || !canPublish}
              className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {publishing ? "Publicando..." : "Publicar material"}
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
              ["Arquivo", file?.name || "Não informado"],
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
