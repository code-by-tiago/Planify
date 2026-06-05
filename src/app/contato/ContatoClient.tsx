"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ContactType = "suporte" | "assinatura" | "erro" | "sugestao" | "parceria" | "pedagogico";

type FormState = {
  nome: string;
  email: string;
  perfil: string;
  tipo: ContactType;
  assunto: string;
  mensagem: string;
};

const initialForm: FormState = {
  nome: "",
  email: "",
  perfil: "Professor",
  tipo: "suporte",
  assunto: "",
  mensagem: "",
};

const contactTypes: Array<{ value: ContactType; label: string; description: string }> = [
  {
    value: "suporte",
    label: "Suporte geral",
    description: "Dúvidas de uso, acesso ou navegação.",
  },
  {
    value: "assinatura",
    label: "Assinatura e pagamento",
    description: "Planos, Stripe, acesso premium e renovação.",
  },
  {
    value: "erro",
    label: "Relatar erro",
    description: "Problemas em página, build, login ou funcionalidade.",
  },
  {
    value: "sugestao",
    label: "Sugestão",
    description: "Ideias para melhorar o Planify.",
  },
  {
    value: "parceria",
    label: "Parceria",
    description: "Escolas, secretarias, projetos e instituições.",
  },
  {
    value: "pedagogico",
    label: "Suporte pedagógico",
    description: "Planejamentos, BNCC, materiais e documentos.",
  },
];

const helpCards = [
  {
    title: "Acesso premium",
    description: "Criar conta não libera automaticamente. O dashboard é liberado após plano ativo.",
    href: "/planos",
    label: "Ver planos",
  },
  {
    title: "Planejamentos",
    description: "Use a BNCC oficial, selecione habilidades e gere a prévia estruturada.",
    href: "/planejamentos",
    label: "Abrir planejamentos",
  },
  {
    title: "Marketplace",
    description: "Área de troca de materiais entre professores, com publicação e anexos preparados.",
    href: "/marketplace",
    label: "Abrir marketplace",
  },
  {
    title: "Biblioteca Premium",
    description: "Materiais oficiais e curados pela curadoria Planify do Planify.",
    href: "/biblioteca",
    label: "Abrir biblioteca",
  },
];

const supportFlow = [
  {
    step: "1",
    title: "Descreva a solicitação",
    description: "Escolha o tipo e escreva a mensagem com clareza.",
  },
  {
    step: "2",
    title: "Equipe analisa",
    description: "O atendimento será direcionado conforme o assunto.",
  },
  {
    step: "3",
    title: "Retorno organizado",
    description: "A resposta será feita pelo canal informado pelo usuário.",
  },
];

function getTypeLabel(type: ContactType): string {
  return contactTypes.find((item) => item.value === type)?.label ?? "Suporte";
}

function countCharacters(value: string): number {
  return value.trim().length;
}

export function ContatoClient() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<{
    type: "info" | "success" | "warning";
    message: string;
  } | null>(null);

  const selectedType = contactTypes.find((item) => item.value === form.tipo);
  const characterCount = useMemo(() => countCharacters(form.mensagem), [form.mensagem]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
    setSubmitted(false);
  }

  function clearForm() {
    setForm(initialForm);
    setStatus(null);
    setSubmitted(false);
  }

  function validateForm(): string | null {
    if (!form.nome.trim()) {
      return "Informe seu nome.";
    }

    if (!form.email.trim() || !form.email.includes("@")) {
      return "Informe um e-mail válido.";
    }

    if (!form.assunto.trim()) {
      return "Informe o assunto da solicitação.";
    }

    if (form.mensagem.trim().length < 20) {
      return "Escreva uma mensagem com pelo menos 20 caracteres.";
    }

    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const error = validateForm();

    if (error) {
      setStatus({
        type: "warning",
        message: error,
      });
      return;
    }

    setSubmitted(true);
    setStatus({
      type: "success",
      message: "Solicitação registrada visualmente. O envio real será conectado em etapa futura.",
    });
  }

  function getStatusClass() {
    if (!status) {
      return "";
    }

    if (status.type === "success") {
      return "border-emerald-300/30 bg-emerald-300/10 text-emerald-100";
    }

    if (status.type === "warning") {
      return "border-amber-300/30 bg-amber-300/10 text-amber-100";
    }

    return "border-cyan-300/30 bg-cyan-300/10 text-cyan-100";
  }

  return (
    <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <aside className="grid gap-6 xl:sticky xl:top-28 xl:h-fit">
          <div className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
              Suporte
            </p>
            <h2 className="mt-3 text-3xl font-black text-white">
              Atendimento organizado.
            </h2>
            <p className="mt-4 text-sm leading-7 text-cyan-100/85">
              Esta área será conectada depois ao fluxo real de atendimento, e-mail ou banco de solicitações.
            </p>

            <div className="mt-6 grid gap-3">
              {supportFlow.map((item) => (
                <div key={item.step} className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-black text-slate-950">
                    {item.step}
                  </span>
                  <div>
                    <p className="text-sm font-black text-white">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-300">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
              Ajuda rápida
            </p>

            <div className="mt-6 grid gap-3">
              {helpCards.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 transition hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-cyan-300/10"
                >
                  <p className="text-sm font-black text-white">{card.title}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{card.description}</p>
                  <p className="mt-3 text-xs font-black text-cyan-200">{card.label} →</p>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <div className="grid gap-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
                  Solicitação
                </p>
                <h2 className="mt-3 text-3xl font-black text-white">
                  Envie sua mensagem
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                  Escolha o tipo de atendimento e descreva o que precisa com detalhes.
                </p>
              </div>

              <button
                type="button"
                onClick={clearForm}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-1 hover:border-rose-300/40 hover:bg-rose-300/10"
              >
                Limpar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-300">Nome</span>
                  <input
                    value={form.nome}
                    onChange={(event) => updateField("nome", event.target.value)}
                    placeholder="Seu nome"
                    className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-300">E-mail</span>
                  <input
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    placeholder="seu@email.com"
                    type="email"
                    className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-300">Perfil</span>
                  <select
                    value={form.perfil}
                    onChange={(event) => updateField("perfil", event.target.value)}
                    className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition focus:border-cyan-300/50"
                  >
                    {["Professor", "Coordenador", "Escola", "Administrador", "Parceiro"].map((option) => (
                      <option key={option} value={option} className="bg-slate-950">
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-300">Tipo de solicitação</span>
                  <select
                    value={form.tipo}
                    onChange={(event) => updateField("tipo", event.target.value as ContactType)}
                    className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition focus:border-cyan-300/50"
                  >
                    {contactTypes.map((option) => (
                      <option key={option.value} value={option.value} className="bg-slate-950">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 md:col-span-2">
                  <span className="text-sm font-bold text-slate-300">Assunto</span>
                  <input
                    value={form.assunto}
                    onChange={(event) => updateField("assunto", event.target.value)}
                    placeholder="Ex.: Dúvida sobre acesso premium"
                    className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                  />
                </label>

                <label className="grid gap-2 md:col-span-2">
                  <span className="text-sm font-bold text-slate-300">Mensagem</span>
                  <textarea
                    value={form.mensagem}
                    onChange={(event) => updateField("mensagem", event.target.value)}
                    rows={8}
                    placeholder="Descreva sua solicitação com detalhes."
                    className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                  />
                  <span className="text-xs font-bold text-slate-500">
                    {characterCount} caracteres
                  </span>
                </label>
              </div>

              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                <p className="text-sm font-black text-cyan-100">{selectedType?.label}</p>
                <p className="mt-1 text-xs leading-5 text-cyan-100/80">{selectedType?.description}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950 shadow-2xl shadow-white/10 transition hover:-translate-y-1 hover:bg-cyan-100"
                >
                  Enviar solicitação
                </button>

                <Link
                  href="/dashboard"
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10"
                >
                  Voltar ao dashboard
                </Link>
              </div>
            </form>

            {status && (
              <div className={`mt-6 rounded-2xl border p-4 text-sm font-bold ${getStatusClass()}`}>
                {status.message}
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
              Prévia
            </p>
            <h2 className="mt-3 text-3xl font-black text-white">Resumo da solicitação</h2>

            <div className="mt-7 rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-6">
              {!submitted ? (
                <div>
                  <p className="text-sm font-black text-white">Aguardando envio</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Após preencher e enviar, o resumo aparecerá aqui.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-950">
                      {getTypeLabel(form.tipo)}
                    </span>
                    <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-200">
                      {form.perfil}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-white">{form.assunto}</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      {form.nome} • {form.email}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                    <p className="text-sm leading-7 text-slate-300">{form.mensagem}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["Assinatura", "Dúvidas sobre plano, pagamento e acesso premium."],
              ["Funcionalidade", "Sugestões para planejamentos, materiais e editor."],
              ["Parceria", "Contato para escolas, projetos e instituições."],
            ].map(([title, description]) => (
              <div key={title} className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl">
                <p className="text-lg font-black text-white">{title}</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
