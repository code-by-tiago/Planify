"use client";

type GenerationCostHintProps = {
  creditCost: number;
  deepSlotConsumed?: boolean;
  label?: string;
  className?: string;
};

/**
 * Compatibilidade para telas antigas: no plano atual, assinante usa as
 * ferramentas ativas sem indicadores de limite de uso.
 */
export function GenerationCostHint(props: GenerationCostHintProps) {
  void props;
  return null;
}
