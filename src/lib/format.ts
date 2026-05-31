export function formatCurrencyBRL(valueInCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
}

export function formatDateBR(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}