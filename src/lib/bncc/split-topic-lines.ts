/** Separa linhas de tema/conteúdo (quebra de linha, ;, vírgula ou separador ·). */
export function splitTopicLines(value: string): string[] {
  return String(value || "")
    .split(/\r?\n|;|,|\s·\s/u)
    .map((line) => line.trim())
    .filter(Boolean);
}
