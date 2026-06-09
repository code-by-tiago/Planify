/** Shared HUD form field styles — Comunidade / Biblioteca / material tools */

export const HUD_FIELD_CLASS =
  "h-11 w-full rounded-xl border border-cyan-400/20 bg-white/90 px-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100";

export const HUD_TEXTAREA_CLASS =
  "w-full resize-none rounded-xl border border-cyan-400/20 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100";

/** Textarea com altura fixa e scroll vertical interno (ex.: campo Conteúdos em Planejamentos). */
export const HUD_SCROLLABLE_TEXTAREA_CLASS = `${HUD_TEXTAREA_CLASS} min-h-[10.5rem] max-h-[10.5rem] overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]`;

export const HUD_CHIP_ACTIVE =
  "rounded-full border border-cyan-500 bg-cyan-600 px-3 py-2 text-xs font-bold text-white shadow-sm";

export const HUD_CHIP_INACTIVE =
  "rounded-full border border-cyan-400/20 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-cyan-400/45 hover:text-slate-950";

export const HUD_FILTER_CHIP_ACTIVE =
  "flex shrink-0 items-center gap-2 rounded-full border border-cyan-500 bg-cyan-600 px-4 py-2 text-sm font-bold text-white shadow-sm";

export const HUD_FILTER_CHIP_INACTIVE =
  "flex shrink-0 items-center gap-2 rounded-full border border-cyan-400/20 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-cyan-400/40 hover:text-slate-950";

export const HUD_SECTION_LABEL =
  "mb-2 block text-sm font-bold text-slate-700";
