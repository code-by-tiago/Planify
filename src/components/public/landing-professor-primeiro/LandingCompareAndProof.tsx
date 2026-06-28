"use client";

import Image from "next/image";
import { COMPARISON_ROWS } from "./constants";
import { ppEyebrow } from "./theme";

const COMPACT_ROWS = COMPARISON_ROWS.slice(0, 4);

export function LandingCompareAndProof() {
  return (
    <section
      id="comparacao"
      className="scroll-mt-24 bg-[#F0F9FA] px-5 py-14 sm:px-8 sm:py-16"
    >
      <div className="mx-auto grid max-w-7xl items-start gap-8 lg:grid-cols-2 lg:gap-10">
        {/* Comparativo */}
        <div>
          <p className={ppEyebrow}>Antes e depois</p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-extrabold text-[#0A192F] sm:text-3xl">
            Sem Planify vs Com Planify
          </h2>

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-2 border-b border-slate-200 text-xs font-extrabold uppercase tracking-wider">
              <div className="bg-slate-100 px-4 py-3 text-slate-500">Sem Planify</div>
              <div className="bg-[#26C6DA]/20 px-4 py-3 text-[#0A192F]">Com Planify</div>
            </div>

            {COMPACT_ROWS.map((row) => (
              <div
                key={row.topic}
                className="grid grid-cols-2 border-b border-slate-100 last:border-b-0"
              >
                <div className="px-4 py-3.5 text-sm font-medium leading-6 text-slate-600">
                  {row.without}
                </div>
                <div className="bg-[#26C6DA]/10 px-4 py-3.5 text-sm font-semibold leading-6 text-[#0A192F]">
                  {row.with}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Depoimento */}
        <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="grid sm:grid-cols-[1fr_1.1fr]">
            <div className="flex flex-col justify-center p-6 sm:p-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#26C6DA]">
                Prova real em sala
              </p>
              <blockquote className="mt-4 text-lg font-bold leading-8 text-[#0A192F] sm:text-xl">
                &ldquo;O Planify organiza as atividades no painel, eu reviso com segurança e o
                material segue direto para a lousa.&rdquo;
              </blockquote>
              <footer className="mt-6">
                <p className="font-extrabold text-[#0A192F]">Helena Lopes</p>
                <p className="text-sm font-semibold text-[#26C6DA]">Professora de Português</p>
              </footer>
            </div>

            <div className="relative min-h-[220px] bg-slate-100 sm:min-h-full">
              <Image
                src="/depoimentos/helena-lopes.jpg"
                alt="Professora Helena Lopes em sala de aula usando material do Planify"
                fill
                sizes="(min-width: 1024px) 28vw, 100vw"
                className="object-cover object-[42%_38%]"
              />
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
