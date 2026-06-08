"use client";

import { useState } from "react";
import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { CREATE_OPTIONS, type CreateOptionId } from "./constants";

export function LandingCreateBlock() {
  const [selected, setSelected] = useState<CreateOptionId>("planejamento");

  const active = CREATE_OPTIONS.find((o) => o.id === selected) ?? CREATE_OPTIONS[0];

  return (
    <section className="isolate bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-center font-[family-name:var(--font-display)] text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Hoje você quer criar:
          </h2>

          <div
            className="mt-6 flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-5"
            data-landing-create
          >
            {CREATE_OPTIONS.map((option) => {
              const isActive = selected === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  data-landing-create-option
                  onClick={() => setSelected(option.id)}
                  className={`flex min-h-[5.5rem] touch-manipulation flex-col items-center justify-center gap-2 overflow-visible rounded-2xl border-2 px-3 py-4 text-center transition-colors ${
                    isActive
                      ? "border-cyan-500 bg-cyan-50 text-cyan-900"
                      : "border-slate-200 bg-white text-slate-700 hover:border-cyan-200 hover:bg-cyan-50/40"
                  }`}
                >
                  <PlanifyIcon
                    name={option.icon as PlanifyIconName}
                    className={`h-5 w-5 shrink-0 ${isActive ? "text-cyan-600" : "text-slate-500"}`}
                  />
                  <span className="text-sm font-bold leading-tight">{option.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href={active.href}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Continuar
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
