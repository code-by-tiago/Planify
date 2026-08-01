import { isSlideDeckHtml } from "@/lib/slides/slide-deck-utils";
import type { MaterialEngineType } from "@/server/materials/material-engine-types";

export type MaterialExportFileFormat = "pdf" | "docx";

export type MaterialExportChannel =
  | "pdf-download"
  | "google-docs"
  | "google-drive"
  | "google-forms"
  | "google-slides"
  | "pptx-download"
  | "google-classroom";

export type MaterialExportPolicy = {
  /** Canais habilitados para este tipo de material. */
  channels: readonly MaterialExportChannel[];
  /** Formato enviado ao Google Drive (quando google-drive está habilitado). */
  driveFormat: MaterialExportFileFormat;
  /** Formato anexado no Google Classroom. */
  classroomFormat: MaterialExportFileFormat;
  /** Perfil do PDF gerado localmente ou no Classroom. */
  pdfProfile: "document" | "slides";
  /** Mensagem curta para tooltip / status na barra de exportação. */
  hint: string;
};

const PDF_VISUAL_HINT =
  "Layout visual — exporte em PDF para manter a grade e o design idênticos ao editor.";

const TEXT_DOC_HINT =
  "Documento editável — ideal para Google Docs e download em PDF.";

const ASSESSMENT_HINT =
  "Avaliação — use Google Forms (digital), PDF (impressão) ou salve no Drive.";

const SLIDES_LEGACY_HINT =
  "Material legado — exporte em PDF para preservar o layout visual.";

/** Política canônica por ferramenta do motor de materiais. */
export const MATERIAL_EXPORT_POLICIES: Record<MaterialEngineType, MaterialExportPolicy> =
  {
    slides: {
      channels: ["pdf-download", "google-drive", "google-classroom"],
      driveFormat: "pdf",
      classroomFormat: "pdf",
      pdfProfile: "slides",
      hint: SLIDES_LEGACY_HINT,
    },
    prova: {
      channels: [
        "pdf-download",
        "google-forms",
        "google-drive",
        "google-classroom",
      ],
      driveFormat: "pdf",
      classroomFormat: "pdf",
      pdfProfile: "document",
      hint: ASSESSMENT_HINT,
    },
    lista: {
      channels: [
        "pdf-download",
        "google-forms",
        "google-drive",
        "google-classroom",
      ],
      driveFormat: "pdf",
      classroomFormat: "pdf",
      pdfProfile: "document",
      hint: ASSESSMENT_HINT,
    },
    apostila: {
      channels: [
        "pdf-download",
        "google-docs",
        "google-drive",
        "google-classroom",
      ],
      driveFormat: "docx",
      classroomFormat: "docx",
      pdfProfile: "document",
      hint: TEXT_DOC_HINT,
    },
    atividade: {
      channels: [
        "pdf-download",
        "google-docs",
        "google-drive",
        "google-classroom",
      ],
      driveFormat: "docx",
      classroomFormat: "docx",
      pdfProfile: "document",
      hint: TEXT_DOC_HINT,
    },
    "plano-aula": {
      channels: [
        "pdf-download",
        "google-docs",
        "google-drive",
        "google-classroom",
      ],
      driveFormat: "docx",
      classroomFormat: "docx",
      pdfProfile: "document",
      hint: TEXT_DOC_HINT,
    },
    resumo: {
      channels: [
        "pdf-download",
        "google-docs",
        "google-drive",
        "google-classroom",
      ],
      driveFormat: "docx",
      classroomFormat: "docx",
      pdfProfile: "document",
      hint: TEXT_DOC_HINT,
    },
    sequencia: {
      channels: [
        "pdf-download",
        "google-docs",
        "google-drive",
        "google-classroom",
      ],
      driveFormat: "docx",
      classroomFormat: "docx",
      pdfProfile: "document",
      hint: TEXT_DOC_HINT,
    },
    projeto: {
      channels: [
        "pdf-download",
        "google-docs",
        "google-drive",
        "google-classroom",
      ],
      driveFormat: "docx",
      classroomFormat: "docx",
      pdfProfile: "document",
      hint: TEXT_DOC_HINT,
    },
    redacao: {
      channels: [
        "pdf-download",
        "google-docs",
        "google-drive",
        "google-classroom",
      ],
      driveFormat: "docx",
      classroomFormat: "docx",
      pdfProfile: "document",
      hint: TEXT_DOC_HINT,
    },
    jogo: {
      channels: ["pdf-download", "google-drive", "google-classroom"],
      driveFormat: "pdf",
      classroomFormat: "pdf",
      pdfProfile: "document",
      hint: PDF_VISUAL_HINT,
    },
    cruzadinha: {
      channels: ["pdf-download", "google-drive", "google-classroom"],
      driveFormat: "pdf",
      classroomFormat: "pdf",
      pdfProfile: "document",
      hint: PDF_VISUAL_HINT,
    },
    flashcards: {
      channels: ["pdf-download", "google-drive", "google-classroom"],
      driveFormat: "pdf",
      classroomFormat: "pdf",
      pdfProfile: "document",
      hint: PDF_VISUAL_HINT,
    },
    "mapa-mental": {
      channels: ["pdf-download", "google-drive", "google-classroom"],
      driveFormat: "pdf",
      classroomFormat: "pdf",
      pdfProfile: "document",
      hint: PDF_VISUAL_HINT,
    },
  };

const PLANNING_POLICY: MaterialExportPolicy = {
  channels: ["pdf-download", "google-docs", "google-drive", "google-classroom"],
  driveFormat: "docx",
  classroomFormat: "docx",
  pdfProfile: "document",
  hint: "Planejamento oficial — exportação em Google Docs com modelo institucional.",
};

const DEFAULT_TEXT_POLICY: MaterialExportPolicy = {
  channels: ["pdf-download", "google-docs", "google-drive", "google-classroom"],
  driveFormat: "docx",
  classroomFormat: "docx",
  pdfProfile: "document",
  hint: TEXT_DOC_HINT,
};

/** Extrai o id da ferramenta de `material:cruzadinha`, `cruzadinha`, etc. */
export function parseMaterialToolId(
  documentType?: string | null,
): MaterialEngineType | null {
  const raw = String(documentType || "").toLowerCase().trim();
  if (!raw) return null;

  const normalized = raw.startsWith("material:") ? raw.slice("material:".length) : raw;

  if (normalized in MATERIAL_EXPORT_POLICIES) {
    return normalized as MaterialEngineType;
  }

  return null;
}

/** Infere a ferramenta pelo HTML quando o metadado do documento está ausente. */
export function inferMaterialToolFromHtml(html: string): MaterialEngineType | null {
  const source = String(html || "");
  if (!source.trim()) return null;

  if (isSlideDeckHtml(source)) return "slides";
  if (/planify-flashcard/i.test(source)) return "flashcards";
  if (/planify-mindmap/i.test(source)) return "mapa-mental";
  if (/planify-game-table--crossword|cruzadinha pedag/i.test(source)) {
    return "cruzadinha";
  }
  if (/planify-game-table|planify-jogo-visual|planify-game-section/i.test(source)) {
    return "jogo";
  }
  if (/planify-questao/i.test(source)) {
    return /exerc[ií]cio/i.test(source) ? "lista" : "prova";
  }

  return null;
}

export function resolveMaterialExportPolicy(
  documentType?: string | null,
  html?: string | null,
): MaterialExportPolicy {
  const type = String(documentType || "").toLowerCase();
  if (type.includes("planejamento")) {
    return PLANNING_POLICY;
  }

  const fromType = parseMaterialToolId(documentType);
  if (fromType) {
    return MATERIAL_EXPORT_POLICIES[fromType];
  }

  const fromHtml = html ? inferMaterialToolFromHtml(html) : null;
  if (fromHtml) {
    return MATERIAL_EXPORT_POLICIES[fromHtml];
  }

  return DEFAULT_TEXT_POLICY;
}

export function materialExportAllows(
  channel: MaterialExportChannel,
  documentType?: string | null,
  html?: string | null,
): boolean {
  if (channel === "google-drive") {
    return true;
  }

  const policy = resolveMaterialExportPolicy(documentType, html);
  return policy.channels.includes(channel);
}

export function resolveDriveExportFormat(
  documentType?: string | null,
  html?: string | null,
): MaterialExportFileFormat {
  return resolveMaterialExportPolicy(documentType, html).driveFormat;
}

export function resolveClassroomExportFormatFromPolicy(
  documentType?: string | null,
  html?: string | null,
): MaterialExportFileFormat {
  return resolveMaterialExportPolicy(documentType, html).classroomFormat;
}
