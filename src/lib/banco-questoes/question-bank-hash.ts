/**
 * Hash estável para deduplicação de questões (enunciado + tipo).
 * Pure JS — seguro para cliente e servidor (sem node:crypto).
 */
function hashPart(text: string, seed: number): string {
  let h = seed;
  for (let i = 0; i < text.length; i += 1) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function computeQuestionContentHash(enunciado: string, tipo: string): string {
  const normalized = `${String(tipo || "discursiva").trim()}|${String(enunciado || "").trim()}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (
    hashPart(normalized, 2166136261) +
    hashPart(normalized, 709607) +
    hashPart(normalized, 374761393) +
    hashPart(normalized, 3266489917)
  ).slice(0, 32);
}
