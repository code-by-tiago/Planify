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
    <section className="px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
          <h2 className="text-center font-[family-name:var(--font-display)] text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Hoje você quer criar:
          </h2>

          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {CREATE_OPTIONS.map((option) => {
              const isActive = selected === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelected(option.id)}
                  className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-center transition ${
                    isActive
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20"
                      : "border-slate-200 bg-slate-50/50 text-slate-700 hover:border-emerald-200 hover:bg-white"
                  }`}
                >
                  <PlanifyIcon
                    name={option.icon as PlanifyIconName}
                    className={`h-5 w-5 ${isActive ? "text-emerald-600" : "text-slate-500"}`}
                  />
                  <span className="text-xs font-bold leading-tight sm:text-sm">{option.label}</span>
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
