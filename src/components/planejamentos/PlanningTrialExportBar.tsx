"use client";

import { useState } from "react";
import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanningTrialPaywallModal } from "./PlanningTrialPaywallModal";

type PlanningTrialExportBarProps = {
  documentHref?: string;
  className?: string;
};

export function PlanningTrialExportBar({
  documentHref = "/testar-planejamento/documento",
  className = "",
}: PlanningTrialExportBarProps) {
  const [paywallOpen, setPaywallOpen] = useState(false);

  const blockedActions = [
    { id: "docx", label: "Baixar DOCX", icon: "download" as const },
    { id: "docs", label: "Google Docs", icon: "fileText" as const },
    { id: "drive", label: "Google Drive", icon: "externalLink" as const },
    { id: "classroom", label: "Classroom", icon: "presentation" as const },
  ];

  return (
    <>
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <div className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/90 px-1 py-0.5">
          {blockedActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => setPaywallOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-[11px] font-bold text-slate-600 transition hover:bg-white hover:text-cyan-800"
              title="Disponível no Planify Pro"
            >
              <PlanifyIcon name={action.icon} className="h-4 w-4" />
              <span className="hidden sm:inline">{action.label}</span>
            </button>
          ))}
        </div>
        <Link
          href={documentHref}
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
        >
          <PlanifyIcon name="editor" className="h-4 w-4" />
          Ver documento completo
        </Link>
      </div>

      <PlanningTrialPaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
      />
    </>
  );
}
