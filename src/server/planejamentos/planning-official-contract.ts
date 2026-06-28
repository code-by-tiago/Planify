/** Períodos-alvo por experiência/linha nos modelos oficiais DOCX (~1–2). */
export const OFFICIAL_PERIODS_PER_EXPERIENCE = 2;

/** Máximo de períodos por linha quando há uma linha por conteúdo informado. */
export const OFFICIAL_MAX_PERIODS_PER_ROW = 10;

export type PeriodDistributionItem = {
  periodos?: number;
};

export function computeIdealRowCount(cargaHoraria: number): number {
  const carga = Math.max(1, Math.floor(cargaHoraria));
  return Math.max(1, Math.ceil(carga / OFFICIAL_PERIODS_PER_EXPERIENCE));
}

export function assessDistributionCoarseness(
  items: PeriodDistributionItem[],
  cargaHoraria: number,
): {
  coarse: boolean;
  maxPeriodosPerRow: number;
  rowCount: number;
  idealRowCount: number;
} {
  const rowCount = items.length;
  const idealRowCount = computeIdealRowCount(cargaHoraria);
  const maxPeriodosPerRow = items.reduce(
    (max, item) => Math.max(max, Math.max(0, Number(item.periodos) || 0)),
    0,
  );

  const minExpectedRows = Math.max(1, Math.floor(idealRowCount * 0.5));
  const coarse =
    maxPeriodosPerRow > OFFICIAL_MAX_PERIODS_PER_ROW || rowCount < minExpectedRows;

  return { coarse, maxPeriodosPerRow, rowCount, idealRowCount };
}
