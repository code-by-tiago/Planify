"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import {
  ppBtnPrimary,
  ppBtnSecondary,
  ppEyebrow,
  ppInput,
  ppLink,
} from "@/components/public/landing-professor-primeiro/theme";

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
  { value: "suporte", label: "Suporte geral", description: "Dúvidas de uso, acesso ou navegação." },
  { value: "assinatura", label: "Assinatura e pagamento", description: "Planos, Stripe, acesso premium e renovação." },
  { value: "erro", label: "Relatar erro", description: "Problemas em página, login ou funcionalidade." },
  { value: "sugestao", label: "Sugestão", description: "Ideias para melhorar o Planify." },
  { value: "parceria", label: "Parceria", description: "Escolas, secretarias e instituições." },
  { value: "pedagogico", label: "Suporte pedagógico", description: "Planejamentos, BNCC, materiais e documentos." },
];

const helpCards = [
  { title: "Acesso premium", description: "O dashboard premium exige plano ativo.", href: "/planos", label: "Ver planos" },
  { title: "Planejamentos", description: "BNCC oficial, habilidades e prévia estruturada.", href: "/planejamentos", label: "Abrir planejamentos" },
  { title: "Marketplace", description: "Troca de materiais entre professores.", href: "/marketplace", label: "Abrir marketplace" },
  { title: "Biblioteca", description: "Materiais curados pela curadoria Planify.", href: "/biblioteca", label: "Abrir biblioteca" },
];

const supportFlow = [
  { step: "1", title: "Descreva a solicitação", description: "Escolha o tipo e escreva com clareza." },
  { step: "2", title: "Equipe analisa", description: "Direcionamento conforme o assunto." },
  { step: "3", title: "Retorno organizado", description: "Resposta pelo canal informado." },
];

function getTypeLabel(type: ContactType): string {
  return contactTypes.find((item) => item.value === type)?.label ?? "Suporte";
}

const inputClass = ppInput;

export function ContatoClient() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<{
    type: "info" | "success" | "warning";
    message: string;
  } | null>(null);

  const selectedType = contactTypes.find((item) => item.value === form.tipo);
  const characterCount = useMemo(() => form.mensagem.trim().length, [form.mensagem]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSubmitted(false);
  }

  function clearForm() {
    setForm(initialForm);
    setStatus(null);
    setSubmitted(false);
  }

  function validateForm(): string | null {
    if (!form.nome.trim()) return "Informe seu nome.";
    if (!form.email.trim() || !form.email.includes("@")) return "Informe um e-mail válido.";
    if (!form.assunto.trim()) return "Informe o assunto da solicitação.";
    if (form.mensagem.trim().length < 20) return "Escreva uma mensagem com pelo menos 20 caracteres.";
    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateForm();
    if (error) {
      setStatus({ type: "warning", message: error });
      return;
    }
    setSubmitted(true);
    setStatus({
      type: "success",
      message: "Solicitação registrada visualmente. O envio real será conectado em etapa futura.",
    });
  }

  function statusClass() {
    if (!status) return "";
    if (status.type === "success") return "border-cyan-200 bg-cyan-50 text-cyan-800";
    if (status.type === "warning") return "border-amber-200 bg-amber-50 text-amber-800";
    return "border-cyan-200 bg-cyan-50 text-cyan-800";
  }

  return (
    <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
      <div className="grid gap-8 xl:grid-cols-[0.85fr_1.15fr]">
        <aside className="grid gap-6 xl:sticky xl:top-24 xl:h-fit">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6">
            <p className={ppEyebrow}>Como funciona</p>
            <div className="mt-5 grid gap-3">
              {supportFlow.map((item) => (
                <div key={item.step} className="flex gap-3 rounded-2xl border border-white bg-white p-4 shadow-sm">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-600 text-xs font-black text-white">
                    {item.step}
                  </span>
                  <div>
                    <p className="text-sm font-black text-slate-950">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className={ppEyebrow}>Ajuda rápida</p>
            <div className="mt-4 grid gap-2">
              {helpCards.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-cyan-200 hover:bg-cyan-50/50"
                >
                  <p className="text-sm font-black text-slate-950">{card.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{card.description}</p>
                  <p className={`mt-2 text-xs font-bold ${ppLink}`}>{card.label} →</p>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <div className="grid gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className={ppEyebrow}>Solicitação</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">Envie sua mensagem</h2>
              </div>
              <button
                type="button"
                onClick={clearForm}
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Limpar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-700">Nome</span>
                  <input
                    value={form.nome}
                    onChange={(e) => updateField("nome", e.target.value)}
                    placeholder="Seu nome"
                    className={inputClass}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-700">E-mail</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="seu@email.com"
                    className={inputClass}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-700">Perfil</span>
                  <select
                    value={form.perfil}
                    onChange={(e) => updateField("perfil", e.target.value)}
                    className={inputClass}
                  >
                    {["Professor", "Coordenador", "Escola", "Administrador", "Parceiro"].map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-700">Tipo</span>
                  <select
                    value={form.tipo}
                    onChange={(e) => updateField("tipo", e.target.value as ContactType)}
                    className={inputClass}
                  >
                    {contactTypes.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 md:col-span-2">
                  <span className="text-sm font-bold text-slate-700">Assunto</span>
                  <input
                    value={form.assunto}
                    onChange={(e) => updateField("assunto", e.target.value)}
                    placeholder="Ex.: Dúvida sobre acesso premium"
                    className={inputClass}
                  />
                </label>
                <label className="grid gap-2 md:col-span-2">
                  <span className="text-sm font-bold text-slate-700">Mensagem</span>
                  <textarea
                    value={form.mensagem}
                    onChange={(e) => updateField("mensagem", e.target.value)}
                    rows={7}
                    placeholder="Descreva sua solicitação com detalhes."
                    className={inputClass}
                  />
                  <span className="text-xs font-semibold text-slate-400">
                    {characterCount} caracteres
                  </span>
                </label>
              </div>

              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 p-4">
                <p className="text-sm font-black text-cyan-900">{selectedType?.label}</p>
                <p className="mt-1 text-xs text-cyan-800/80">{selectedType?.description}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="submit" className={ppBtnPrimary}>
                  Enviar solicitação
                </button>
                <Link href="/dashboard" className={ppBtnSecondary}>
                  Voltar ao painel
                </Link>
              </div>
            </form>

            {status ? (
              <div className={`mt-5 rounded-2xl border p-4 text-sm font-semibold ${statusClass()}`}>
                {status.message}
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className={ppEyebrow}>Prévia</p>
            <h2 className="mt-2 text-xl font-black text-slate-950">Resumo da solicitação</h2>
            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-5">
              {!submitted ? (
                <p className="text-sm text-slate-500">
                  Após preencher e enviar, o resumo aparecerá aqui.
                </p>
              ) : (
                <div className="grid gap-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-xs font-black text-white">
                      {getTypeLabel(form.tipo)}
                    </span>
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-700">
                      {form.perfil}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-950">{form.assunto}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {form.nome} · {form.email}
                    </p>
                  </div>
                  <p className="text-sm leading-7 text-slate-600">{form.mensagem}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
