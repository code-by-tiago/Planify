"use client";

import { AdminPanel, AdminStatCard, formatBrl } from "./AdminCommandCenterShell";

type FinancialMetrics = {
  mrrEstimatedBrl: number;
  mrrFormula: string;
  mrrBreakdown: {
    subscriptionMrrBrl: number;
    schoolLicenseMrrBrl: number;
    activeSubscriptions: number;
    activeSchoolLicenses: number;
  };
  costPerRequestBrl: number;
  costFormula: string;
  generationsThisMonth: number;
  estimatedMonthlyGeminiCostBrl: number;
  avgTokensPerGeneration: number;
};

export function AdminFinancialCards({ financial }: { financial: FinancialMetrics }) {
  const costPct =
    financial.estimatedMonthlyGeminiCostBrl > 0
      ? Math.min(
          100,
          (financial.costPerRequestBrl / (financial.mrrEstimatedBrl || 1)) * 10000,
        )
      : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <AdminPanel title="MRR Estimado" subtitle={financial.mrrFormula}>
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminStatCard
            label="MRR total"
            value={formatBrl(financial.mrrEstimatedBrl)}
            detail="Receita recorrente estimada"
            accent="emerald"
          />
          <AdminStatCard
            label="Assinaturas"
            value={formatBrl(financial.mrrBreakdown.subscriptionMrrBrl)}
            detail={`${financial.mrrBreakdown.activeSubscriptions} ativas/trial`}
            accent="cyan"
          />
          <AdminStatCard
            label="Licenças escola"
            value={formatBrl(financial.mrrBreakdown.schoolLicenseMrrBrl)}
            detail={`${financial.mrrBreakdown.activeSchoolLicenses} escolas com membros ativos`}
            accent="violet"
          />
        </div>
      </AdminPanel>

      <AdminPanel title="Custo por requisição" subtitle={financial.costFormula}>
        <div className="grid gap-3">
          <AdminStatCard
            label="Custo médio / geração"
            value={formatBrl(financial.costPerRequestBrl)}
            detail={`${financial.generationsThisMonth} gerações no mês · ~${financial.avgTokensPerGeneration} tokens/req`}
            accent="amber"
          />
          <div>
            <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <span>Custo Gemini mensal est.</span>
              <span className="text-amber-400">
                {formatBrl(financial.estimatedMonthlyGeminiCostBrl)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all"
                style={{ width: `${Math.max(8, Math.min(100, costPct))}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-600">
              Tarifas configuráveis via GEMINI_* e USD_BRL_RATE no ambiente.
            </p>
          </div>
        </div>
      </AdminPanel>
    </div>
  );
}
