/** Glossário pedagógico BR para STT + pós-correção de siglas. */

export const PEDAGOGICAL_GLOSSARY_TERMS = [
  "BNCC",
  "PEI",
  "TEA",
  "TDAH",
  "EJA",
  "SAEB",
  "ENEM",
  "EF",
  "EM",
  "AEE",
  "NEE",
  "PCN",
  "LDB",
  "IDEB",
  "INEP",
  "MEC",
  "PNE",
  "PPP",
  "HTPC",
  "HTPI",
  "ABP",
  "STEAM",
  "TEACCH",
  "ABA",
  "CID",
  "DSM",
  "LIBRAS",
] as const;

/** Pares comuns de erro de ditado → forma correta. */
const SIGLA_CORRECTIONS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bbenécer\b/gi, replacement: "BNCC" },
  { pattern: /\bbe\s*ene\s*c[eê]\s*c[eê]\b/gi, replacement: "BNCC" },
  { pattern: /\bbe\s*ene\s*c[eê]\s*c[eê]\s*c[eê]\b/gi, replacement: "BNCC" },
  { pattern: /\bb\s*n\s*c\s*c\b/gi, replacement: "BNCC" },
  { pattern: /\bpai\b(?=\s+(para|de|do|da|com|um|uma|aluno|estudante))/gi, replacement: "PEI" },
  { pattern: /\bp\.?\s*e\.?\s*i\.?\b/gi, replacement: "PEI" },
  { pattern: /\bt[eê]a\b/gi, replacement: "TEA" },
  { pattern: /\bte\s*a\b/gi, replacement: "TEA" },
  { pattern: /\bautismo\s+espectro\b/gi, replacement: "TEA" },
  { pattern: /\btdah\b/gi, replacement: "TDAH" },
  { pattern: /\bt\s*d\s*a\s*h\b/gi, replacement: "TDAH" },
  { pattern: /\bd[eé]ficit\s+de\s+aten[cç][aã]o\b/gi, replacement: "TDAH" },
  { pattern: /\beja\b/gi, replacement: "EJA" },
  { pattern: /\be\s*j\s*a\b/gi, replacement: "EJA" },
  { pattern: /\beduca[cç][aã]o\s+de\s+jovens\s+e\s+adultos\b/gi, replacement: "EJA" },
  { pattern: /\bsaeb\b/gi, replacement: "SAEB" },
  { pattern: /\bs\s*a\s*e\s*b\b/gi, replacement: "SAEB" },
  { pattern: /\benem\b/gi, replacement: "ENEM" },
  { pattern: /\be\s*n\s*e\s*m\b/gi, replacement: "ENEM" },
  { pattern: /\baee\b/gi, replacement: "AEE" },
  { pattern: /\batendimento\s+educacional\s+especializado\b/gi, replacement: "AEE" },
  { pattern: /\blibras\b/gi, replacement: "LIBRAS" },
  { pattern: /\bideb\b/gi, replacement: "IDEB" },
  { pattern: /\binep\b/gi, replacement: "INEP" },
];

export function buildPedagogicalSttContextBlock(): string {
  return [
    "DICIONÁRIO PEDAGÓGICO (preserve estas siglas exatamente):",
    PEDAGOGICAL_GLOSSARY_TERMS.join(", "),
    "Exemplos: BNCC (não 'benécer'), PEI (não 'pai'), TEA (autismo), TDAH, EJA, SAEB, ENEM, AEE, LIBRAS.",
  ].join(" ");
}

export function correctPedagogicalTranscript(raw: string): string {
  let text = raw.trim();
  if (!text) return text;
  for (const rule of SIGLA_CORRECTIONS) {
    text = text.replace(rule.pattern, rule.replacement);
  }
  return text.replace(/\s{2,}/g, " ").trim();
}
