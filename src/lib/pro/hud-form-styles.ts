/** Shared HUD form field styles — Comunidade / Biblioteca / material tools */

/** Hub externo das ferramentas (mesmo formato do Planejamento). */
export const HUD_TOOL_HUB_CLASS =
  "planify-hud pl-hud-hub mx-auto max-w-7xl space-y-5 px-3 sm:px-4 lg:px-0";

/** Painel de formulário padrão (vidro, igual Planejamento). */
export const HUD_FORM_PANEL_CLASS =
  "pl-hud-glass rounded-2xl border border-cyan-400/20 p-5 sm:p-6";

/** Grid de campos educacionais (2 colunas em md+). */
export const HUD_FORM_GRID_CLASS = "grid gap-5 md:grid-cols-2";

/** Wrapper label + campo (espaçamento do Planejamento). */
export const HUD_FORM_LABEL_WRAP_CLASS = "grid gap-2";

export const HUD_FIELD_CLASS =
  "h-11 w-full rounded-xl border border-cyan-400/20 bg-white/90 px-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100";

export const HUD_TEXTAREA_CLASS =
  "w-full resize-none rounded-xl border border-cyan-400/20 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100";

/** Textarea com altura fixa e scroll vertical interno (ex.: campo Conteúdos em Planejamentos). */
export const HUD_SCROLLABLE_TEXTAREA_CLASS =
  `${HUD_TEXTAREA_CLASS} planify-conteudos-textarea block h-[10.5rem] min-h-[10.5rem] max-h-[10.5rem] overflow-y-scroll overflow-x-hidden overscroll-y-contain [scrollbar-gutter:stable]`;

/** Botão/ação com alvo de toque mínimo 44px (polegar). */
export const HUD_TOUCH_BTN =
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold";

/** Chip/filtro com altura confortável no mobile. */
export const HUD_TOUCH_CHIP =
  "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-semibold";

export const HUD_CHIP_ACTIVE =
  "rounded-full border border-cyan-500 bg-cyan-600 px-3 py-2.5 text-sm font-bold text-white shadow-sm min-h-11";

export const HUD_CHIP_INACTIVE =
  "rounded-full border border-cyan-400/20 bg-white px-3 py-2.5 text-sm font-bold text-slate-600 transition hover:border-cyan-400/45 hover:text-slate-950 min-h-11";

export const HUD_FILTER_CHIP_ACTIVE =
  "flex shrink-0 items-center gap-2 rounded-full border border-cyan-500 bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 min-h-11";

export const HUD_FILTER_CHIP_INACTIVE =
  "flex shrink-0 items-center gap-2 rounded-full border border-cyan-400/20 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-cyan-400/40 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 min-h-11";

export const HUD_SECTION_LABEL =
  "block text-sm font-bold text-slate-500";

/** Cabeçalho de seção dentro do painel (kicker + título). */
export const HUD_FORM_SECTION_KICKER =
  "text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-600";

export const HUD_FORM_SECTION_TITLE =
  "mt-3 text-sm font-semibold tracking-tight text-slate-900 sm:text-base";
