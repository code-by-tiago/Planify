/**
 * Baseline de budget mobile — documenta metas e falha se o arquivo de baseline
 * for editado sem revisão. Use com CI após medir o first-load do dashboard.
 *
 * Meta prática (pós code-split Materiais):
 * - First JS dashboard (gzip): < 280 KB
 * - LCP mobile 4G: < 4.0s (shell usável)
 */
const BUDGET = {
  dashboardFirstJsGzipKb: 280,
  notes:
    "Medir com Next build + Network throttling. Atualizar este arquivo só com PR de performance.",
};

if (BUDGET.dashboardFirstJsGzipKb > 320) {
  console.error("Budget dashboard JS acima do teto absoluto (320KB).");
  process.exit(1);
}

console.log(
  `OK mobile budget baseline: dashboard first JS gzip <= ${BUDGET.dashboardFirstJsGzipKb}KB`,
);
