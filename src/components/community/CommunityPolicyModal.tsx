"use client";

import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { useState } from "react";

const GUIDELINES = [
  "Compartilhe apenas materiais pedagógicos que você criou ou tem direito de distribuir.",
  "Respeite colegas: comentários construtivos, sem ofensas ou discriminação.",
  "Proteja dados de alunos — não publique informações pessoais identificáveis.",
  "Cite fontes e autores quando adaptar materiais de terceiros.",
  "Denuncie conteúdo inadequado; a equipe Planify pode remover publicações.",
  "Mensagens diretas são entre amigos aceitos — use com profissionalismo.",
];

export function CommunityPolicyLink() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-bold text-cyan-700 underline-offset-2 hover:underline"
      >
        Política da Comunidade
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="community-policy-title"
            className="max-h-[min(80vh,640px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-cyan-400/20 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-cyan-600">
                  Comunidade Planify
                </p>
                <h2 id="community-policy-title" className="mt-1 text-xl font-extrabold text-slate-950">
                  Política da Comunidade
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Fechar"
              >
                <PlanifyIcon name="close" className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              A Comunidade existe para professores premium trocarem materiais alinhados à prática
              pedagógica brasileira. Ao participar, você concorda com as diretrizes abaixo:
            </p>

            <ul className="mt-4 space-y-3">
              {GUIDELINES.map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-sm leading-6 text-slate-700"
                >
                  <PlanifyIcon name="checkCircle" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="mt-5 text-xs font-medium text-slate-500">
              Dúvidas ou denúncias graves: contate o suporte Planify pelo painel ou e-mail
              institucional da sua escola parceira.
            </p>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-2.5 text-sm font-bold text-white"
            >
              Entendi
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
