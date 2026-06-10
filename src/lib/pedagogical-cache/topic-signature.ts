/**
 * Assinatura de tópico e hash de conteúdo para dedup do reservatório didático.
 * Mesmo padrão de question-bank-hash — pure JS, seguro para cliente e servidor.
 */

function hashPart(text: string, seed: number): string {
  let h = seed;
  for (let i = 0; i < text.length; i += 1) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function normalizeText(value: string): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function computeHash(normalized: string): string {
  return (
    hashPart(normalized, 2166136261) +
    hashPart(normalized, 709607) +
    hashPart(normalized, 374761393) +
    hashPart(normalized, 3266489917)
  ).slice(0, 32);
}

export type TopicSignatureInput = {
  tema: string;
  componente?: string;
  etapa?: string;
  bnccCodigo?: string;
};

export function computeTopicSignature(input: TopicSignatureInput): string {
  const tema = normalizeText(input.tema);
  const componente = normalizeText(input.componente || "");
  const etapa = normalizeText(input.etapa || "");
  const bncc = normalizeText(input.bnccCodigo || "");

  const normalized = [tema, componente, etapa, bncc].filter(Boolean).join("|");
  return computeHash(normalized || "empty");
}

export function computeContentHash(bodyMarkdown: string, title = ""): string {
  const normalized = `${normalizeText(title)}|${normalizeText(bodyMarkdown)}`;
  return computeHash(normalized || "empty");
}

export function normalizeAliasKey(value: string): string {
  return normalizeText(value);
}
