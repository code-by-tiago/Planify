"use client";

import { useState } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import {
  ppBtnPrimary,
  ppEyebrow,
  ppInput,
  ppTitle,
  ppTitleAccent,
} from "@/components/public/landing-professor-primeiro/theme";
import {
  buildCommercialWhatsAppUrl,
  buildEscolasLeadWhatsAppMessage,
  type EscolasLeadForm,
} from "@/lib/public/escolasCommercial";

const initialForm: EscolasLeadForm = {
  nomeGestor: "",
  nomeEscola: "",
  email: "",
  telefone: "",
  numeroProfessores: "",
};

const inputClass = ppInput;

export function EscolasContactForm() {
  const [form, setForm] = useState<EscolasLeadForm>(initialForm);
  const [status, setStatus] = useState<{ type: "warning" | "success"; message: string } | null>(
    null,
  );

  function updateField<K extends keyof EscolasLeadForm>(key: K, value: EscolasLeadForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setStatus(null);
  }

  function validateForm(): string | null {
    if (!form.nomeGestor.trim()) return "Informe o nome do gestor.";
    if (!form.nomeEscola.trim()) return "Informe o nome da escola.";
    if (!form.email.trim() || !form.email.includes("@")) return "Informe um e-mail válido.";
    if (!form.telefone.trim()) return "Informe um telefone para contato.";
    if (!form.numeroProfessores.trim()) return "Informe o número de professores.";
    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateForm();
    if (error) {
      setStatus({ type: "warning", message: error });
      return;
    }

    const message = buildEscolasLeadWhatsAppMessage(form);
    window.open(buildCommercialWhatsAppUrl(message), "_blank", "noopener,noreferrer");
    setStatus({
      type: "success",
      message:
        "Redirecionando para o WhatsApp comercial. Nossa equipe retornará em horário comercial.",
    });
  }

  return (
    <section id="contato" className="scroll-mt-28 border-t border-slate-200/80 bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className={ppEyebrow}>Contato comercial</p>
          <h2 className={`${ppTitle} mt-4 text-3xl sm:text-4xl`}>
            Solicite uma demonstração{" "}
            <span className={ppTitleAccent}>para sua instituição</span>
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-slate-600">
            Preencha o formulário abaixo. Nossa equipe comercial entrará em contato para
            apresentar o painel institucional e elaborar uma proposta conforme o porte da
            sua escola.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-10 max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 sm:col-span-1">
              <span className="text-sm font-bold text-slate-700">Nome do Gestor</span>
              <input
                value={form.nomeGestor}
                onChange={(e) => updateField("nomeGestor", e.target.value)}
                placeholder="Nome completo"
                className={inputClass}
                autoComplete="name"
              />
            </label>
            <label className="grid gap-2 sm:col-span-1">
              <span className="text-sm font-bold text-slate-700">Nome da Escola</span>
              <input
                value={form.nomeEscola}
                onChange={(e) => updateField("nomeEscola", e.target.value)}
                placeholder="Instituição de ensino"
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 sm:col-span-1">
              <span className="text-sm font-bold text-slate-700">E-mail</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="gestor@escola.com.br"
                className={inputClass}
                autoComplete="email"
              />
            </label>
            <label className="grid gap-2 sm:col-span-1">
              <span className="text-sm font-bold text-slate-700">Telefone</span>
              <input
                type="tel"
                value={form.telefone}
                onChange={(e) => updateField("telefone", e.target.value)}
                placeholder="(11) 99999-9999"
                className={inputClass}
                autoComplete="tel"
              />
            </label>
            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm font-bold text-slate-700">Número de Professores</span>
              <input
                value={form.numeroProfessores}
                onChange={(e) => updateField("numeroProfessores", e.target.value)}
                placeholder="Ex.: 28 professores"
                className={inputClass}
              />
            </label>
          </div>

          <button
            type="submit"
            className={`${ppBtnPrimary} mt-6 w-full`}
          >
            Falar com nossa equipe comercial
            <PlanifyIcon name="arrowRight" className="h-4 w-4" />
          </button>

          {status ? (
            <div
              className={`mt-5 rounded-2xl border p-4 text-sm font-semibold ${
                status.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              {status.message}
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
}
