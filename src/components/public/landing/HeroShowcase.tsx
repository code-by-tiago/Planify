"use client";

import { motion, useReducedMotion } from "framer-motion";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";

type ShowcaseTool = {
  id: string;
  shortTitle: string;
  icon: PlanifyIconName;
};

export function HeroShowcase({ tools }: { tools: ShowcaseTool[] }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="relative"
    >
      {/* Cartão flutuante decorativo */}
      <div className="pl-float absolute -right-3 -top-5 z-10 hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl sm:flex sm:items-center sm:gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <PlanifyIcon name="checkCircle" className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
            Alinhado à
          </p>
          <p className="text-sm font-black leading-none text-slate-950">BNCC</p>
        </div>
      </div>

      <div className="rounded-[2.25rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-300/50">
        <div className="flex items-center justify-between gap-4 rounded-[1.6rem] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-5 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">
              Painel do professor
            </p>
            <p className="mt-1 text-2xl font-black tracking-tight text-white">
              Criação com IA
            </p>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20">
            <PlanifyIcon name="spark" className="h-6 w-6" />
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.45,
                delay: 0.25 + index * 0.07,
                ease: "easeOut",
              }}
              whileHover={reduce ? undefined : { y: -4 }}
              className="rounded-[1.3rem] border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-indigo-200"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                <PlanifyIcon name={tool.icon} className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-black leading-tight text-slate-950">
                {tool.shortTitle}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-black text-slate-600">
            <span className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="absolute h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Gerando material...
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white">
            <PlanifyIcon name="download" className="h-3.5 w-3.5" />
            DOCX
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default HeroShowcase;
