"use client";

import { useState } from "react";
import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { CREATE_OPTIONS, type CreateOptionId } from "./constants";
import styles from "./landing-create-block.module.css";

export function LandingCreateBlock() {
  const [selected, setSelected] = useState<CreateOptionId>("planejamento");

  const active = CREATE_OPTIONS.find((o) => o.id === selected) ?? CREATE_OPTIONS[0];

  return (
    <section className="isolate border-y border-slate-200/80 bg-slate-50/50 px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-center font-[family-name:var(--font-display)] text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Hoje você quer criar:
          </h2>

          <div className={styles.list} data-landing-create>
            {CREATE_OPTIONS.map((option) => {
              const isActive = selected === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  data-landing-create-option
                  onClick={() => setSelected(option.id)}
                  className={`${styles.option} ${isActive ? styles.optionActive : ""}`}
                >
                  <PlanifyIcon
                    name={option.icon as PlanifyIconName}
                    className={styles.optionIcon}
                  />
                  <span className={styles.optionLabel}>{option.label}</span>
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
