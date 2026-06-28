"use client";

import { useState } from "react";
import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { CREATE_OPTIONS, type CreateOptionId } from "./constants";
import { LandingToolIconBadge } from "./LandingToolIconBadge";
import styles from "./landing-create-block.module.css";
import { ppBtnNavy } from "./theme";

export function LandingCreateBlock() {
  const [selected, setSelected] = useState<CreateOptionId>("planejamento");

  const active = CREATE_OPTIONS.find((o) => o.id === selected) ?? CREATE_OPTIONS[0];

  return (
    <section className="bg-white px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-4xl rounded-2xl bg-[#F0F9FA] p-6 sm:p-8">
        <h2 className="text-center font-[family-name:var(--font-display)] text-2xl font-extrabold text-[#0A192F] sm:text-3xl">
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
                <LandingToolIconBadge
                  accent={option.accent}
                  icon={option.icon as PlanifyIconName}
                  size="md"
                />
                <span className={styles.optionLabel}>{option.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <Link href={active.href} className={ppBtnNavy}>
            Continuar
            <PlanifyIcon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
