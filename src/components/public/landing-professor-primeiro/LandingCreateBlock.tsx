"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { CREATE_OPTIONS, type CreateOptionId } from "./constants";
import styles from "./landing-create-block.module.css";

export function LandingCreateBlock() {
  const [selected, setSelected] = useState<CreateOptionId>("planejamento");

  const active = CREATE_OPTIONS.find((o) => o.id === selected) ?? CREATE_OPTIONS[0];

  useEffect(() => {
    const container = document.querySelector("[data-landing-create]");
    const btn = document.querySelector("[data-landing-create-option]");
    if (!btn) return;

    const cs = getComputedStyle(btn);
    const cc = container ? getComputedStyle(container) : null;

    // #region agent log
    fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "1b39d8",
      },
      body: JSON.stringify({
        sessionId: "1b39d8",
        runId: "post-fix-v2",
        hypothesisId: "A",
        location: "LandingCreateBlock.tsx:mount",
        message: "Create block computed styles",
        data: {
          innerWidth: window.innerWidth,
          display: cc?.display ?? null,
          btnOverflow: cs.overflow,
          btnShadow: cs.boxShadow,
          btnTransform: cs.transform,
          btnClassList: btn.className,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, []);

  return (
    <section className="isolate bg-white px-5 py-16 sm:px-8 sm:py-20">
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
