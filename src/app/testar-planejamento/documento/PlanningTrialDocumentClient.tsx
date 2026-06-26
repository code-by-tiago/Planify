"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { PlanningTrialExportBar } from "@/components/planejamentos/PlanningTrialExportBar";
import { PlanningTrialPaywallModal } from "@/components/planejamentos/PlanningTrialPaywallModal";
import {
  getActivePlanningTrialTab,
  readPlanningTrialDocument,
  savePlanningTrialDocument,
  type PlanningTrialStoredDocument,
} from "@/lib/planejamentos/planning-trial-storage";

export function PlanningTrialDocumentClient() {
  const router = useRouter();
  const [doc, setDoc] = useState<PlanningTrialStoredDocument | null>(null);
  const [activeTabId, setActiveTabId] = useState("anual");
  const [paywallOpen, setPaywallOpen] = useState(false);
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const stored = readPlanningTrialDocument();
    if (!stored) {
      router.replace("/testar-planejamento");
      return;
    }
    setDoc(stored);
    setActiveTabId(stored.activeTabId || stored.tabs[0]?.id || "anual");
  }, [router]);

  useEffect(() => {
    if (!doc) return;
    const article = articleRef.current;
    const docScrollable =
      document.documentElement.scrollHeight > document.documentElement.clientHeight;
    const articleOverflow = article
      ? window.getComputedStyle(article).overflowY
      : "missing";
    const articleMaxHeight = article
      ? window.getComputedStyle(article).maxHeight
      : "missing";
    // #region agent log
    fetch('http://127.0.0.1:7718/ingest/9ac33552-969d-48be-9089-3a3b10571400',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a1058c'},body:JSON.stringify({sessionId:'a1058c',location:'PlanningTrialDocumentClient.tsx:scroll',message:'trial document scroll metrics',data:{docScrollable,articleOverflow,articleMaxHeight,scrollHeight:document.documentElement.scrollHeight,clientHeight:document.documentElement.clientHeight,articleScrollHeight:article?.scrollHeight??0},timestamp:Date.now(),hypothesisId:'A',runId:'post-fix'})}).catch(()=>{});
    // #endregion
  }, [doc, activeTabId]);

  const activeTab = useMemo(() => {
    if (!doc) return null;
    return doc.tabs.find((tab) => tab.id === activeTabId) || getActivePlanningTrialTab(doc);
  }, [doc, activeTabId]);

  function selectTab(tabId: string) {
    setActiveTabId(tabId);
    if (doc) {
      savePlanningTrialDocument({ ...doc, activeTabId: tabId });
    }
  }

  if (!doc || !activeTab) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-medium text-slate-500">
        Carregando documento…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <PlanifyBrand href="/" hideTagline />
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/testar-planejamento"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:text-cyan-700"
            >
              Voltar ao teste
            </Link>
            <button
              type="button"
              onClick={() => setPaywallOpen(true)}
              className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm"
            >
              Assinar para baixar
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 pb-16 sm:px-6">
        <div className="mb-4 rounded-2xl border border-cyan-100 bg-cyan-50/80 px-4 py-3 text-sm font-medium text-cyan-900">
          Visualização completa do pacote de teste: anual e trimestres extraídos da
          mesma matriz. Role a página à vontade — exportações ficam no Planify Pro.
        </div>

        {doc.tabs.length > 1 ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {doc.tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id)}
                className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                  activeTabId === tab.id
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-slate-700 hover:bg-emerald-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              {activeTab.label}
            </p>
            <h1 className="mt-1 text-lg font-extrabold text-slate-900">{activeTab.title}</h1>
          </div>
          <PlanningTrialExportBar />
        </div>

        <article
          ref={articleRef}
          className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10"
          dangerouslySetInnerHTML={{ __html: activeTab.html }}
        />
      </div>

      <PlanningTrialPaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
      />
    </div>
  );
}
