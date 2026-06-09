"use client";

import { EditorShareBar } from "@/components/editor/EditorShareBar";
import { downloadEditorExport } from "@/lib/downloads/editor-export-client";
import {
  createEditorDocument,
  saveEditorDocument,
  syncOpenDocumentToHistory,
  type EditorStoredPayload,
} from "@/lib/editor/editor-storage";
import { wrapAsCleanPrintHtml } from "@/lib/editor/editor-print-html";
import {
  getClosestTable,
  getClosestTableCell,
} from "@/lib/editor/editor-selection-utils";
import { isSlideDeckHtml } from "@/lib/slides/slide-deck-utils";
import { SlideAiAdjustPanel } from "@/components/slides/SlideAiAdjustPanel";
import type {
  MaterialEngineInput,
  MaterialEngineResponse,
} from "@/server/materials/material-engine-types";
import { MaterialQualityScoreBar } from "@/components/materiais/MaterialQualityScoreBar";
import {
  buildElevatePlanningPayload,
  requestPlanningGeneration,
} from "@/lib/planejamentos/elevate-planning-client";
import {
  buildPlanningEditorHtml,
  planningPayloadToHtmlContext,
} from "@/lib/planejamentos/planning-editor-html";
import type { PlanningEditorMeta } from "@/lib/planejamentos/planning-editor-flow";
import {
  loadPlanningEditorBundle,
  savePlanningEditorBundle,
  type PlanningEditorBundle,
} from "@/lib/planejamentos/planning-editor-bundle";
import { resolvePlanningPayloadForGoogleExport } from "@/lib/planejamentos/planning-google-export-payload";
import {
  buildElevatePayload,
  requestMaterialGeneration,
} from "@/lib/materiais/elevate-material-client";
import type { MaterialEditorMeta } from "@/lib/materiais/material-editor-flow";
import { PlanifyWorkspacePane } from "@/components/pro/PlanifyWorkspacePane";
import { PlanifyPageHero } from "@/components/pro/PlanifyPageHero";
import {
  ChangeEvent,
  MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type StoredEditorDocument = {
  type?: string;
  title?: string;
  html?: string;
  content?: string;
  payload?: Record<string, unknown>;
  updatedAt?: string;
};

type SavedDocument = {
  id: string;
  title: string;
  html: string;
  updatedAt: string;
};

const STORAGE_DOCUMENT_KEY = "planify_editor_document";
const STORAGE_CONTENT_KEY = "planify_editor_content";
const STORAGE_SAVED_KEY = "planify_editor_saved_documents";

const defaultDocument = `
  <article class="planify-doc">
    <h1>Documento pedagógico</h1>
    <p>Comece a editar seu material aqui. Você pode inserir tabelas, imagens, listas, títulos e ajustar a formatação.</p>
    <table>
      <tbody>
        <tr>
          <td><strong>Campo</strong></td>
          <td><strong>Informação</strong></td>
        </tr>
        <tr>
          <td>Professor</td>
          <td></td>
        </tr>
        <tr>
          <td>Componente</td>
          <td></td>
        </tr>
        <tr>
          <td>Turma</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </article>
`;

const fontOptions = [
  "Arial",
  "Times New Roman",
  "Calibri",
  "Verdana",
  "Georgia",
  "Cambria",
  "Tahoma",
];

const fontSizeOptions = [
  { label: "10", value: "10pt" },
  { label: "11", value: "11pt" },
  { label: "12", value: "12pt" },
  { label: "14", value: "14pt" },
  { label: "16", value: "16pt" },
  { label: "18", value: "18pt" },
  { label: "24", value: "24pt" },
];

const lineHeightOptions = [
  { label: "1.0", value: "1" },
  { label: "1.15", value: "1.15" },
  { label: "1.5", value: "1.5" },
  { label: "2.0", value: "2" },
];

function nowLabel() {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());
}

function createId() {
  return `editor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getDocumentTitleFromHtml(html: string) {
  if (typeof window === "undefined") {
    return "Documento Planify";
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const firstHeading = doc.querySelector("h1,h2,h3");

  return firstHeading?.textContent?.trim() || "Documento Planify";
}

function sanitizeFilename(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 80) || "documento-planify"
  );
}

function downloadExistingBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}


function filenameFromResponse(response: Response, fallback: string) {
  const custom = response.headers.get("X-Planify-Filename");

  if (custom?.toLowerCase().endsWith(".docx")) {
    return custom;
  }

  const disposition = response.headers.get("Content-Disposition") || "";
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
  const raw = utf8Match?.[1] || asciiMatch?.[1] || fallback;

  try {
    const decoded = decodeURIComponent(raw);
    return decoded.toLowerCase().endsWith(".docx") ? decoded : `${decoded.replace(/\.doc$/i, "")}.docx`;
  } catch {
    return fallback.toLowerCase().endsWith(".docx") ? fallback : `${fallback}.docx`;
  }
}

function loadSavedDocuments(): SavedDocument[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_SAVED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed.slice(0, 20) : [];
  } catch {
    return [];
  }
}

function saveSavedDocuments(items: SavedDocument[]) {
  window.localStorage.setItem(STORAGE_SAVED_KEY, JSON.stringify(items.slice(0, 20)));
}

function loadInitialDocument(): { title: string; html: string; storedDocument: StoredEditorDocument | null } {
  if (typeof window === "undefined") {
    return {
      title: "Documento Planify",
      html: defaultDocument,
      storedDocument: null,
    };
  }

  try {
    const storedDocumentRaw = window.localStorage.getItem(STORAGE_DOCUMENT_KEY);
    const storedDocument = storedDocumentRaw
      ? (JSON.parse(storedDocumentRaw) as StoredEditorDocument)
      : null;

    const content =
      storedDocument?.html ||
      storedDocument?.content ||
      window.localStorage.getItem(STORAGE_CONTENT_KEY) ||
      defaultDocument;

    return {
      title: storedDocument?.title || getDocumentTitleFromHtml(content),
      html: content,
      storedDocument,
    };
  } catch {
    const content = window.localStorage.getItem(STORAGE_CONTENT_KEY) || defaultDocument;

    return {
      title: getDocumentTitleFromHtml(content),
      html: content,
      storedDocument: null,
    };
  }
}

function closestFigure(image: HTMLImageElement) {
  const figure = image.closest("figure");

  return figure instanceof HTMLElement ? figure : image;
}

function clearImageOutline(image: HTMLImageElement | null) {
  if (!image) {
    return;
  }

  image.style.outline = "";
  image.style.outlineOffset = "";
  image.style.cursor = "pointer";
}

function closestEditableBlock(node: Node | null, editor: HTMLElement | null) {
  if (!node || !editor) {
    return null;
  }

  let current: Node | null =
    node.nodeType === Node.TEXT_NODE ? node.parentNode : node;

  while (current && current !== editor) {
    if (current instanceof HTMLElement) {
      const tag = current.tagName.toLowerCase();

      if (
        [
          "p",
          "div",
          "li",
          "h1",
          "h2",
          "h3",
          "h4",
          "blockquote",
          "td",
          "th",
          "figure",
        ].includes(tag)
      ) {
        return current;
      }
    }

    current = current.parentNode;
  }

  return null;
}

type EditorClientProps = {
  /** Painel do dashboard: sem hero grande; layout ocupa 100% da altura */
  embedded?: boolean;
};

export function EditorClient({ embedded = false }: EditorClientProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const selectedImageRef = useRef<HTMLImageElement | null>(null);
  const selectedTableRef = useRef<HTMLTableElement | null>(null);
  const undoStackRef = useRef<string[]>([]);
  const redoStackRef = useRef<string[]>([]);
  const isApplyingUndoRef = useRef(false);
  const undoInputTimerRef = useRef<number | null>(null);
  const [title, setTitle] = useState("Documento Planify");
  const [status, setStatus] = useState("Editor pronto.");
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [selectedBlock, setSelectedBlock] = useState("p");
  const [fontFamily, setFontFamily] = useState("Times New Roman");
  const [fontSizePt, setFontSizePt] = useState("12pt");
  const [lineHeight, setLineHeight] = useState("1.5");
  const [spacingBefore, setSpacingBefore] = useState(0);
  const [spacingAfter, setSpacingAfter] = useState(10);
  const [firstLineIndent, setFirstLineIndent] = useState(1.25);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedImageName, setSelectedImageName] = useState("");
  const [selectedImageWidth, setSelectedImageWidth] = useState(60);
  const [documentSource, setDocumentSource] = useState<StoredEditorDocument | null>(null);
  const [originHint, setOriginHint] = useState<string | null>(null);
  const [showVersionsPanel, setShowVersionsPanel] = useState(false);
  const [showFormatTools, setShowFormatTools] = useState(!embedded);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const [isTableActive, setIsTableActive] = useState(false);
  const [isSlideDeck, setIsSlideDeck] = useState(false);
  const [slideTheme, setSlideTheme] = useState<string | null>(null);
  const [elevatingQuality, setElevatingQuality] = useState(false);
  const [adjustingSlides, setAdjustingSlides] = useState(false);
  const [planningBundle, setPlanningBundle] = useState<PlanningEditorBundle | null>(null);
  const [activeBundleIndex, setActiveBundleIndex] = useState(0);
  const activeBundleIndexRef = useRef(0);
  const skipBundleAutoSaveRef = useRef(true);

  useEffect(() => {
    activeBundleIndexRef.current = activeBundleIndex;
  }, [activeBundleIndex]);

  const lastSavedLabel = useMemo(() => nowLabel(), []);

  const materialMeta = useMemo((): MaterialEditorMeta | null => {
    const raw = documentSource?.payload as { raw?: MaterialEditorMeta } | undefined;
    return raw?.raw ?? null;
  }, [documentSource]);

  const planningMeta = useMemo((): PlanningEditorMeta | null => {
    const raw = documentSource?.payload as
      | { raw?: PlanningEditorMeta & { matrizPlanejamento?: unknown } }
      | undefined;
    const meta = raw?.raw;
    if (!meta?.tipoPlanejamento && !meta?.componente) return null;
    if (String(documentSource?.type || "").includes("material")) return null;
    return meta;
  }, [documentSource]);

  const getPlanningPayloadForExport = useCallback((): Record<string, unknown> | null => {
    const raw = documentSource?.payload as
      | { raw?: PlanningEditorMeta & { matrizPlanejamento?: unknown } }
      | undefined;

    return resolvePlanningPayloadForGoogleExport(raw?.raw ?? planningMeta ?? undefined);
  }, [documentSource, planningMeta]);

  const canElevateMaterial = Boolean(
    materialMeta?.generationPayload &&
      String(documentSource?.type || "").includes("material"),
  );

  const canElevatePlanning = Boolean(
    planningMeta?.generationPayload &&
      String(documentSource?.type || "").includes("planejamento"),
  );

  const canElevateDocument = canElevateMaterial || canElevatePlanning;

  const documentQualityScore =
    typeof materialMeta?.qualityScore === "number"
      ? materialMeta.qualityScore
      : typeof planningMeta?.qualityScore === "number"
        ? planningMeta.qualityScore
        : null;

  const documentQualityIssues =
    materialMeta?.qualityIssues ?? planningMeta?.qualityIssues ?? [];

  function syncSlideDeckFlags(html: string, stored?: StoredEditorDocument | null) {
    const raw = stored?.payload as { raw?: MaterialEditorMeta } | undefined;
    const meta = raw?.raw;
    const type = String(stored?.type || meta?.toolId || "");
    const deck =
      type.includes("slides") ||
      meta?.toolId === "slides" ||
      isSlideDeckHtml(html);
    setIsSlideDeck(deck);
    const fromHtml = html.match(/data-planify-slide-theme=["']([a-z]+)["']/i)?.[1];
    setSlideTheme(meta?.slideTheme || meta?.designSlides || fromHtml || null);
  }

  const toolBtnClass = embedded
    ? "h-11 min-w-11 shrink-0 rounded-md border border-slate-200 bg-white px-2 text-sm font-black text-slate-700 transition hover:border-slate-950 lg:h-7 lg:min-w-7 lg:px-1.5 lg:text-[11px]"
    : "h-9 min-w-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-black text-slate-700 transition hover:border-slate-950";

  const toolSelectClass = embedded
    ? "h-7 shrink-0 rounded-md border border-slate-200 bg-slate-50 px-1.5 text-[11px] font-bold text-slate-950 outline-none focus:border-slate-950"
    : "h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-950 outline-none focus:border-slate-950";

  const actionBtnClass = embedded
    ? "rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-black text-slate-700 transition hover:border-slate-950"
    : "rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-700 transition hover:border-slate-950";

  useEffect(() => {
    if (!embedded) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setShowFormatTools(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [embedded]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");
    const isBundle = params.get("bundle") === "1";

    if (from === "materiais") {
      setOriginHint(
        "Material didático recebido do gerador — ajuste o texto, complemente e exporte pelo Google Docs quando estiver pronto.",
      );
    } else if (from === "planejamentos" && isBundle) {
      const bundle = loadPlanningEditorBundle();
      if (bundle && bundle.tabs.length > 1) {
        setOriginHint(
          "Pacote anual + trimestres — use as abas para alternar entre os documentos. Cada um é salvo separadamente no histórico.",
        );
        return;
      }
    }

    if (from === "planejamentos") {
      setOriginHint("Planejamento recebido — revise a formatação antes de exportar.");
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bundleFromSession =
      params.get("from") === "planejamentos" && params.get("bundle") === "1"
        ? loadPlanningEditorBundle()
        : null;
    const initial = loadInitialDocument();
    const activeBundleTab = bundleFromSession?.tabs[bundleFromSession.activeIndex];
    const resolvedHtml = activeBundleTab?.content || initial.html;
    const resolvedTitle = activeBundleTab?.title || initial.title;
    const resolvedStoredDocument: StoredEditorDocument | null = activeBundleTab
      ? {
          type: activeBundleTab.type,
          title: activeBundleTab.title,
          html: activeBundleTab.content,
          content: activeBundleTab.content,
          payload: {
            source: "planejamento",
            raw: activeBundleTab.raw,
            id: activeBundleTab.id,
          },
          updatedAt: new Date().toISOString(),
        }
      : initial.storedDocument;

    if (bundleFromSession && bundleFromSession.tabs.length > 1) {
      setPlanningBundle(bundleFromSession);
      setActiveBundleIndex(bundleFromSession.activeIndex);
      activeBundleIndexRef.current = bundleFromSession.activeIndex;
      skipBundleAutoSaveRef.current = true;
    }

    setTitle(resolvedTitle);
    setDocumentSource(resolvedStoredDocument);
    setSavedDocuments(loadSavedDocuments());

    if (editorRef.current) {
      editorRef.current.innerHTML = resolvedHtml;
      prepareImagesInsideEditor();
      updateWordCount();
      syncSlideDeckFlags(resolvedHtml, resolvedStoredDocument);
      seedUndoStack(resolvedHtml);
    }

    setIsLoaded(true);
    setStatus(`Documento carregado. Última verificação: ${lastSavedLabel}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (skipBundleAutoSaveRef.current) {
      skipBundleAutoSaveRef.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      persistCurrentDocument("Salvo automaticamente.");
    }, 1200);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, wordCount, isLoaded, planningBundle]);

  function focusEditor() {
    editorRef.current?.focus();
  }

  function getEditorHtml() {
    return editorRef.current?.innerHTML || "";
  }

  function applyEditorHtml(html: string) {
    clearSelectedImage();
    clearSelectedTable();

    if (editorRef.current) {
      editorRef.current.innerHTML = html;
      prepareImagesInsideEditor();
      updateWordCount();
      seedUndoStack(html);
    }
  }

  function setEditorHtml(html: string) {
    applyEditorHtml(html);
  }

  function seedUndoStack(html?: string) {
    const snapshot = html ?? getEditorHtml();
    undoStackRef.current = [snapshot];
    redoStackRef.current = [];
  }

  function pushUndoSnapshot() {
    if (isApplyingUndoRef.current) {
      return;
    }

    const html = getEditorHtml();
    const stack = undoStackRef.current;

    if (stack[stack.length - 1] === html) {
      return;
    }

    stack.push(html);

    if (stack.length > 60) {
      stack.shift();
    }

    redoStackRef.current = [];
  }

  function scheduleUndoSnapshot() {
    if (undoInputTimerRef.current) {
      window.clearTimeout(undoInputTimerRef.current);
    }

    undoInputTimerRef.current = window.setTimeout(() => {
      pushUndoSnapshot();
      undoInputTimerRef.current = null;
    }, 400);
  }

  function updateWordCount() {
    const text = editorRef.current?.innerText || "";
    const words = text
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    setWordCount(words.length);
    syncSlideDeckFlags(getEditorHtml(), documentSource);
  }

  function exec(command: string, value?: string) {
    if (command !== "undo" && command !== "redo") {
      pushUndoSnapshot();
    }

    focusEditor();
    document.execCommand(command, false, value);
    updateWordCount();
    persistCurrentDocument("Alteração aplicada.");
  }

  function insertHyperlink() {
    const url = window.prompt("URL do link:", "https://");

    if (!url?.trim()) {
      return;
    }

    exec("createLink", url.trim());
  }

  function undoEdit() {
    focusEditor();
    const stack = undoStackRef.current;

    if (stack.length > 1) {
      const current = stack.pop()!;

      redoStackRef.current.push(current);
      const previous = stack[stack.length - 1];

      isApplyingUndoRef.current = true;

      if (editorRef.current) {
        editorRef.current.innerHTML = previous;
        prepareImagesInsideEditor();
        updateWordCount();
        clearSelectedImage();
        clearSelectedTable();
      }

      isApplyingUndoRef.current = false;
      persistCurrentDocument("Desfeito.");
      setStatus("Desfeito.");
      return;
    }

    exec("undo");
    setStatus("Desfeito.");
  }

  function redoEdit() {
    focusEditor();
    const redo = redoStackRef.current;

    if (redo.length > 0) {
      const next = redo.pop()!;

      undoStackRef.current.push(next);
      isApplyingUndoRef.current = true;

      if (editorRef.current) {
        editorRef.current.innerHTML = next;
        prepareImagesInsideEditor();
        updateWordCount();
        clearSelectedImage();
        clearSelectedTable();
      }

      isApplyingUndoRef.current = false;
      persistCurrentDocument("Refeito.");
      setStatus("Refeito.");
      return;
    }

    exec("redo");
    setStatus("Refeito.");
  }

  function getSelectionBlock() {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) {
      return null;
    }

    const node = selection.anchorNode;

    if (!node || !editor.contains(node)) {
      return null;
    }

    return closestEditableBlock(node, editor);
  }

  function applyToCurrentBlock(styles: Partial<CSSStyleDeclaration>, message: string) {
    focusEditor();

    const block = getSelectionBlock() || editorRef.current;

    if (!block) {
      setStatus("Clique no texto que deseja ajustar.");
      return;
    }

    Object.entries(styles).forEach(([key, value]) => {
      if (typeof value === "string") {
        block.style.setProperty(key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`), value);
      }
    });

    updateWordCount();
    persistCurrentDocument(message);
  }

  function applyFontFamily(value: string) {
    setFontFamily(value);
    exec("fontName", value);
  }

  function applyFontSize(value: string) {
    setFontSizePt(value);
    applyToCurrentBlock({ fontSize: value }, `Fonte ajustada para ${value}.`);
  }

  function applyLineHeight(value: string) {
    setLineHeight(value);
    applyToCurrentBlock({ lineHeight: value }, `Espaçamento entre linhas ${value}.`);
  }

  function applyParagraphSpacing(before: number, after: number) {
    setSpacingBefore(before);
    setSpacingAfter(after);
    applyToCurrentBlock(
      {
        marginTop: `${before}pt`,
        marginBottom: `${after}pt`,
      },
      "Espaçamento de parágrafo ajustado.",
    );
  }

  function applyFirstLineIndent(value: number) {
    setFirstLineIndent(value);
    applyToCurrentBlock(
      {
        textIndent: `${value}cm`,
      },
      "Recuo de primeira linha ajustado.",
    );
  }

  function applyNormalAbnt() {
    applyToCurrentBlock(
      {
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: "12pt",
        lineHeight: "1.5",
        textAlign: "justify",
        textIndent: "1.25cm",
        marginTop: "0pt",
        marginBottom: "10pt",
      },
      "Texto normal ABNT aplicado.",
    );
  }

  function applyTitleAbnt() {
    exec("formatBlock", "h1");
    applyToCurrentBlock(
      {
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: "14pt",
        lineHeight: "1.5",
        textAlign: "center",
        textIndent: "0",
        textTransform: "uppercase",
        marginTop: "0pt",
        marginBottom: "24pt",
      },
      "Título ABNT aplicado.",
    );
  }

  function applyCitationAbnt() {
    exec("formatBlock", "blockquote");
    applyToCurrentBlock(
      {
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: "10pt",
        lineHeight: "1",
        textAlign: "justify",
        textIndent: "0",
        marginLeft: "4cm",
        marginTop: "12pt",
        marginBottom: "12pt",
      },
      "Citação ABNT aplicada.",
    );
  }

  function applyAbntToDocument() {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    editor.classList.add("planify-abnt-page");
    editor.style.fontFamily = '"Times New Roman", Times, serif';
    editor.style.fontSize = "12pt";
    editor.style.lineHeight = "1.5";
    editor.style.textAlign = "justify";

    editor.querySelectorAll("p, li").forEach((node) => {
      if (node instanceof HTMLElement) {
        node.style.fontFamily = '"Times New Roman", Times, serif';
        node.style.fontSize = "12pt";
        node.style.lineHeight = "1.5";
        node.style.textAlign = "justify";
        node.style.textIndent = "1.25cm";
        node.style.marginTop = "0pt";
        node.style.marginBottom = "10pt";
      }
    });

    editor.querySelectorAll("h1").forEach((node) => {
      if (node instanceof HTMLElement) {
        node.style.fontFamily = '"Times New Roman", Times, serif';
        node.style.fontSize = "14pt";
        node.style.lineHeight = "1.5";
        node.style.textAlign = "center";
        node.style.textIndent = "0";
        node.style.textTransform = "uppercase";
      }
    });

    editor.querySelectorAll("h2, h3").forEach((node) => {
      if (node instanceof HTMLElement) {
        node.style.fontFamily = '"Times New Roman", Times, serif';
        node.style.fontSize = "12pt";
        node.style.lineHeight = "1.5";
        node.style.textAlign = "left";
        node.style.textIndent = "0";
      }
    });

    editor.querySelectorAll("blockquote").forEach((node) => {
      if (node instanceof HTMLElement) {
        node.style.fontFamily = '"Times New Roman", Times, serif';
        node.style.fontSize = "10pt";
        node.style.lineHeight = "1";
        node.style.textAlign = "justify";
        node.style.textIndent = "0";
        node.style.marginLeft = "4cm";
      }
    });

    setFontFamily("Times New Roman");
    setFontSizePt("12pt");
    setLineHeight("1.5");
    setSpacingBefore(0);
    setSpacingAfter(10);
    setFirstLineIndent(1.25);
    persistCurrentDocument("Padrão ABNT aplicado ao documento.");
  }

  function prepareImagesInsideEditor() {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    editor.querySelectorAll("img").forEach((node) => {
      if (!(node instanceof HTMLImageElement)) {
        return;
      }

      node.dataset.planifyImage = "true";
      if (node.classList.contains("planify-slide-image")) {
        node.title = "Clique para ajustar; use Remover ou troque por Imagem no menu";
      }
      node.style.maxWidth = "100%";
      node.style.height = "auto";
      node.style.cursor = "pointer";

      if (!node.style.width) {
        node.style.width = "60%";
      }

      const parent = node.parentElement;

      if (parent?.tagName.toLowerCase() === "figure") {
        parent.style.maxWidth = "100%";

        if (!parent.style.textAlign) {
          parent.style.textAlign = "center";
        }
      }
    });
  }

  async function elevarQualidadeNoEditor() {
    const base = materialMeta?.generationPayload;
    if (!base) {
      setStatus("Abra um material gerado pelo Planify para elevar a qualidade.");
      return;
    }

    setElevatingQuality(true);
    setStatus("Regenerando material com foco em qualidade...");

    try {
      const problemas = [
        ...(materialMeta?.qualityIssues ?? []),
        ...(typeof materialMeta?.qualityScore === "number" &&
        materialMeta.qualityScore < 90
          ? ["Elevar especificidade dos enunciados e do gabarito."]
          : []),
      ];
      const payload = buildElevatePayload(base, problemas);
      const data = await requestMaterialGeneration(payload);

      if (!data.html) {
        throw new Error("A regeneração não retornou conteúdo.");
      }

      if (editorRef.current) {
        editorRef.current.innerHTML = data.html;
        prepareImagesInsideEditor();
        updateWordCount();
        syncSlideDeckFlags(data.html, documentSource);
        seedUndoStack(data.html);
      }

      const nextMeta: MaterialEditorMeta = {
        ...(materialMeta ?? {
          toolId: "prova",
          tema: title,
          componente: "",
          anoSerie: "",
        }),
        qualityScore:
          typeof data.qualityScore === "number" ? data.qualityScore : null,
        qualityIssues: Array.isArray(data.qualityIssues)
          ? data.qualityIssues.map((item) => String(item)).filter(Boolean)
          : [],
        generationPayload: payload,
      };

      const source = documentSource;
      const saved = syncOpenDocumentToHistory({
        title: title.trim() || getDocumentTitleFromHtml(data.html),
        content: data.html,
        type: source?.type || `material:${nextMeta.toolId}`,
        payload: {
          source: "material",
          raw: nextMeta,
          id: (source?.payload as { id?: string } | undefined)?.id,
        },
      });

      setDocumentSource({
        type: saved.type,
        title: saved.title,
        html: saved.content,
        content: saved.content,
        payload: {
          source: saved.source,
          subtitle: saved.subtitle,
          raw: nextMeta,
          id: saved.id,
        },
        updatedAt: saved.updatedAt,
      });

      window.dispatchEvent(new Event("planify:credits-changed"));
      setStatus("Qualidade elevada — revise o material antes de exportar.");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Não foi possível elevar a qualidade.",
      );
    } finally {
      setElevatingQuality(false);
    }
  }

  function handleSlideAiAdjustResult(result: {
    html: string;
    estrutura: MaterialEngineResponse | null;
    payload: MaterialEngineInput;
    qualityScore?: number | null;
    qualityIssues?: string[];
  }) {
    if (editorRef.current) {
      editorRef.current.innerHTML = result.html;
      prepareImagesInsideEditor();
      updateWordCount();
      syncSlideDeckFlags(result.html, documentSource);
      seedUndoStack(result.html);
    }

    const nextMeta: MaterialEditorMeta = {
      ...(materialMeta ?? {
        toolId: "slides",
        tema: title,
        componente: "",
        anoSerie: "",
      }),
      slideTheme:
        result.estrutura?.slideTheme ||
        materialMeta?.slideTheme ||
        materialMeta?.designSlides ||
        null,
      designSlides:
        result.estrutura?.slideTheme ||
        materialMeta?.designSlides ||
        null,
      qualityScore:
        typeof result.qualityScore === "number" ? result.qualityScore : null,
      qualityIssues: result.qualityIssues ?? [],
      generationPayload: result.payload,
    };

    const source = documentSource;
    const saved = syncOpenDocumentToHistory({
      title: title.trim() || getDocumentTitleFromHtml(result.html),
      content: result.html,
      type: source?.type || "material:slides",
      payload: {
        source: "material",
        raw: nextMeta,
        id: (source?.payload as { id?: string } | undefined)?.id,
      },
    });

    setDocumentSource({
      type: saved.type,
      title: saved.title,
      html: saved.content,
      content: saved.content,
      payload: {
        source: saved.source,
        subtitle: saved.subtitle,
        raw: nextMeta,
        id: saved.id,
      },
      updatedAt: saved.updatedAt,
    });

    window.dispatchEvent(new Event("planify:credits-changed"));
    setStatus("Ajuste aplicado — revise os slides antes de salvar ou exportar.");
  }

  async function elevarQualidadePlanejamentoNoEditor() {
    const base = planningMeta?.generationPayload;
    if (!base) {
      setStatus("Abra um planejamento gerado pelo Planify para elevar a qualidade.");
      return;
    }

    setElevatingQuality(true);
    setStatus("Regenerando matriz com foco em qualidade...");

    try {
      const problemas = [
        ...(planningMeta?.qualityIssues ?? []),
        ...(typeof planningMeta?.qualityScore === "number" && planningMeta.qualityScore < 90
          ? ["Elevar especificidade da matriz, metodologias e avaliações por conteúdo."]
          : []),
      ];
      const payload = buildElevatePlanningPayload(base, problemas);
      const data = await requestPlanningGeneration(payload);
      const planning = data.planejamento;
      const html = buildPlanningEditorHtml(planningPayloadToHtmlContext(payload), planning);

      if (editorRef.current) {
        editorRef.current.innerHTML = html;
        prepareImagesInsideEditor();
        updateWordCount();
        syncSlideDeckFlags(html, documentSource);
        seedUndoStack(html);
      }

      const nextMeta: PlanningEditorMeta = {
        ...(planningMeta ?? {
          etapa: "",
          anoSerie: "",
          componente: "",
          tipoPlanejamento: "anual",
        }),
        qualityScore:
          typeof data.qualityScore === "number" ? data.qualityScore : null,
        qualityIssues: Array.isArray(data.qualityIssues)
          ? data.qualityIssues.map((item) => String(item)).filter(Boolean)
          : [],
        generationPayload: payload,
      };

      const source = documentSource;
      const saved = syncOpenDocumentToHistory({
        title: planning.titulo || title.trim() || "Planejamento",
        content: html,
        type: source?.type || `planejamento:${payload.tipoPlanejamento || "anual"}`,
        payload: {
          source: "planejamento",
          raw: { ...nextMeta, matrizPlanejamento: planning },
          id: (source?.payload as { id?: string } | undefined)?.id,
        },
      });

      setDocumentSource({
        type: saved.type,
        title: saved.title,
        html: saved.content,
        content: saved.content,
        payload: {
          source: saved.source,
          subtitle: saved.subtitle,
          raw: { ...nextMeta, matrizPlanejamento: planning },
          id: saved.id,
        },
        updatedAt: saved.updatedAt,
      });

      setTitle(saved.title);
      window.dispatchEvent(new Event("planify:credits-changed"));
      setStatus("Qualidade elevada — revise o planejamento antes de exportar.");
    } catch (error) {
      const code =
        error instanceof Error && "code" in error
          ? String((error as Error & { code?: string }).code || "")
          : "";
      if (code === "daily_limit_reached") {
        window.dispatchEvent(new Event("planify:credits-changed"));
      }
      setStatus(
        error instanceof Error
          ? error.message
          : "Não foi possível elevar a qualidade do planejamento.",
      );
    } finally {
      setElevatingQuality(false);
    }
  }

  function elevarQualidadeDocumentoNoEditor() {
    if (canElevatePlanning) {
      void elevarQualidadePlanejamentoNoEditor();
      return;
    }
    void elevarQualidadeNoEditor();
  }

  function persistCurrentDocument(message = "Documento salvo.") {
    if (typeof window === "undefined") {
      return;
    }

    prepareImagesInsideEditor();

    const html = getEditorHtml();
    const currentTitle = title.trim() || getDocumentTitleFromHtml(html);
    const source = documentSource;
    const payload = source?.payload as EditorStoredPayload | undefined;
    const bundleIndex = activeBundleIndexRef.current;
    const activeBundleTab = planningBundle?.tabs[bundleIndex];
    const bundleRaw =
      (payload?.raw as Record<string, unknown> | undefined) ?? activeBundleTab?.raw;
    const historyPayload: EditorStoredPayload | undefined = activeBundleTab
      ? {
          ...payload,
          source: "planejamento",
          id: activeBundleTab.id,
          raw: bundleRaw ?? activeBundleTab.raw,
        }
      : payload;
    const historyType = activeBundleTab?.type || source?.type || "editor";

    const saved = syncOpenDocumentToHistory({
      title: currentTitle,
      content: html,
      type: historyType,
      payload: historyPayload,
    });

    setDocumentSource({
      type: saved.type,
      title: saved.title,
      html: saved.content,
      content: saved.content,
      payload: {
        source: saved.source,
        subtitle: saved.subtitle,
        raw: saved.raw,
        id: saved.id,
      },
      updatedAt: saved.updatedAt,
    });

    if (planningBundle) {
      const updatedTabs = [...planningBundle.tabs];
      updatedTabs[bundleIndex] = {
        ...updatedTabs[bundleIndex],
        content: html,
        title: currentTitle,
        raw: bundleRaw ?? updatedTabs[bundleIndex].raw,
      };
      const nextBundle = { ...planningBundle, tabs: updatedTabs };
      savePlanningEditorBundle(nextBundle);
      setPlanningBundle(nextBundle);
    }

    window.dispatchEvent(new Event("planify:history-changed"));
    setStatus(`${message} ${nowLabel()}`);
  }

  function switchPlanningBundleTab(nextIndex: number) {
    if (!planningBundle || nextIndex === activeBundleIndex) {
      return;
    }

    if (nextIndex < 0 || nextIndex >= planningBundle.tabs.length) {
      return;
    }

    skipBundleAutoSaveRef.current = true;
    prepareImagesInsideEditor();

    const outgoingIndex = activeBundleIndexRef.current;
    const html = getEditorHtml();
    const currentTitle = title.trim() || getDocumentTitleFromHtml(html);
    const currentTab = planningBundle.tabs[outgoingIndex];
    const source = documentSource;
    const payload = source?.payload as EditorStoredPayload | undefined;
    const outgoingRaw =
      (payload?.raw as Record<string, unknown> | undefined) ?? currentTab.raw;

    syncOpenDocumentToHistory({
      title: currentTitle,
      content: html,
      type: currentTab.type,
      payload: {
        ...payload,
        source: "planejamento",
        id: currentTab.id,
        raw: outgoingRaw,
      },
    });

    const updatedTabs = [...planningBundle.tabs];
    updatedTabs[outgoingIndex] = {
      ...updatedTabs[outgoingIndex],
      content: html,
      title: currentTitle,
      raw: outgoingRaw,
    };

    const nextTab = updatedTabs[nextIndex];
    const nextBundle = { activeIndex: nextIndex, tabs: updatedTabs };
    savePlanningEditorBundle(nextBundle);
    setPlanningBundle(nextBundle);
    activeBundleIndexRef.current = nextIndex;
    setActiveBundleIndex(nextIndex);

    setTitle(nextTab.title);
    const nextDocumentSource: StoredEditorDocument = {
      type: nextTab.type,
      title: nextTab.title,
      html: nextTab.content,
      content: nextTab.content,
      payload: {
        source: "planejamento",
        raw: nextTab.raw,
        id: nextTab.id,
      },
      updatedAt: new Date().toISOString(),
    };

    setDocumentSource(nextDocumentSource);
    applyEditorHtml(nextTab.content);
    syncSlideDeckFlags(nextTab.content, nextDocumentSource);

    saveEditorDocument(
      createEditorDocument({
        id: nextTab.id,
        source: "planejamento",
        title: nextTab.title,
        type: nextTab.type,
        content: nextTab.content,
        raw: nextTab.raw,
      }),
    );

    setStatus(`Aba "${nextTab.label}" carregada.`);
  }

  function saveVersion() {
    const html = getEditorHtml();
    const currentTitle = title.trim() || getDocumentTitleFromHtml(html);
    const next: SavedDocument = {
      id: createId(),
      title: currentTitle,
      html,
      updatedAt: new Date().toISOString(),
    };

    const updated = [next, ...savedDocuments].slice(0, 20);
    setSavedDocuments(updated);
    saveSavedDocuments(updated);
    persistCurrentDocument("Versão salva.");
  }

  function loadVersion(item: SavedDocument) {
    const confirmed = window.confirm(`Abrir a versão "${item.title}" no editor?`);

    if (!confirmed) {
      return;
    }

    setTitle(item.title);
    setDocumentSource(null);
    setEditorHtml(item.html);
    setStatus("Versão carregada.");
  }

  function removeVersion(id: string) {
    const updated = savedDocuments.filter((item) => item.id !== id);

    setSavedDocuments(updated);
    saveSavedDocuments(updated);
    setStatus("Versão removida.");
  }

  function handleBlockChange(value: string) {
    setSelectedBlock(value);
    exec("formatBlock", value);
  }

  function insertTable() {
    const rowsRaw = window.prompt("Quantas linhas?", "3");
    const colsRaw = window.prompt("Quantas colunas?", "3");

    const rows = Math.max(1, Math.min(20, Number(rowsRaw) || 3));
    const cols = Math.max(1, Math.min(10, Number(colsRaw) || 3));

    let html = '<table><tbody>';

    for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
      html += "<tr>";

      for (let colIndex = 0; colIndex < cols; colIndex += 1) {
        html += `<td>${rowIndex === 0 ? "<strong></strong>" : "<br>"}</td>`;
      }

      html += "</tr>";
    }

    html += "</tbody></table><p><br></p>";

    exec("insertHTML", html);
    setStatus("Tabela inserida. Toque nela para editar ou excluir.");
  }

  function clearTableOutline(table: HTMLTableElement | null) {
    if (!table) {
      return;
    }

    table.style.outline = "";
    table.style.outlineOffset = "";
  }

  function selectTable(table: HTMLTableElement) {
    if (selectedTableRef.current && selectedTableRef.current !== table) {
      clearTableOutline(selectedTableRef.current);
    }

    selectedTableRef.current = table;
    table.style.outline = "3px solid #22d3ee";
    table.style.outlineOffset = "4px";
    setIsTableActive(true);
    setStatus("Tabela selecionada. Use os controles para editar ou excluir.");
  }

  function clearSelectedTable() {
    clearTableOutline(selectedTableRef.current);
    selectedTableRef.current = null;
    setIsTableActive(false);
  }

  function getCurrentTable() {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection?.anchorNode) {
      return selectedTableRef.current;
    }

    return (
      getClosestTable(selection.anchorNode, editor) || selectedTableRef.current
    );
  }

  function getCurrentTableCell() {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection?.anchorNode) {
      return null;
    }

    return getClosestTableCell(selection.anchorNode, editor);
  }

  function removeCurrentTable(skipConfirm = false) {
    const table = getCurrentTable();

    if (!table) {
      setStatus("Toque dentro da tabela para selecioná-la.");
      return;
    }

    if (!skipConfirm && !window.confirm("Excluir esta tabela inteira?")) {
      return;
    }

    pushUndoSnapshot();
    table.remove();
    clearSelectedTable();
    persistCurrentDocument("Tabela removida.");
    setStatus("Tabela removida.");
  }

  function removeTableRow() {
    const cell = getCurrentTableCell();
    const table = getCurrentTable();

    if (!cell || !table) {
      setStatus("Posicione o cursor dentro da tabela.");
      return;
    }

    const row = cell.closest("tr");

    if (!row) {
      return;
    }

    pushUndoSnapshot();

    if (table.rows.length <= 1) {
      table.remove();
      clearSelectedTable();
    } else {
      row.remove();
    }

    persistCurrentDocument("Linha removida.");
    setStatus("Linha removida.");
  }

  function removeTableColumn() {
    const cell = getCurrentTableCell();
    const table = getCurrentTable();

    if (!cell || !table) {
      setStatus("Posicione o cursor dentro da tabela.");
      return;
    }

    const colIndex = cell.cellIndex;

    pushUndoSnapshot();

    if (table.rows[0]?.cells.length <= 1) {
      table.remove();
      clearSelectedTable();
    } else {
      Array.from(table.rows).forEach((row) => {
        row.cells[colIndex]?.remove();
      });
    }

    persistCurrentDocument("Coluna removida.");
    setStatus("Coluna removida.");
  }

  function deleteSelectionOrBlock() {
    focusEditor();
    const selection = window.getSelection();

    if (selection && !selection.isCollapsed) {
      pushUndoSnapshot();
      document.execCommand("delete", false);
      updateWordCount();
      persistCurrentDocument("Seleção removida.");
      setStatus("Seleção removida.");
      return;
    }

    const table = getCurrentTable();

    if (table) {
      removeCurrentTable(true);
      return;
    }

    const block = getSelectionBlock();

    if (block) {
      pushUndoSnapshot();
      block.remove();
      updateWordCount();
      persistCurrentDocument("Bloco removido.");
      setStatus("Bloco removido.");
      return;
    }

    document.execCommand("delete", false);
    updateWordCount();
    persistCurrentDocument("Conteúdo removido.");
  }

  function insertPageBreak() {
    exec("insertHTML", '<hr class="page-break"><p><br></p>');
  }

  function insertDivider() {
    exec("insertHorizontalRule");
  }

  function triggerImagePicker() {
    imageInputRef.current?.click();
  }

  function handleImageSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setStatus("Selecione uma imagem válida.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const src = String(reader.result || "");

      if (!src) {
        return;
      }

      exec(
        "insertHTML",
        `<figure data-planify-figure="true" style="margin: 16px auto; max-width:100%; text-align:center;">
          <img data-planify-image="true" src="${src}" alt="${file.name}" style="width:60%;max-width:100%;height:auto;border-radius:12px;cursor:pointer;" />
          <figcaption style="font-size:12px;color:#64748b;margin-top:6px;">${file.name}</figcaption>
        </figure><p><br></p>`,
      );

      prepareImagesInsideEditor();
      setStatus("Imagem inserida. Clique nela para ajustar tamanho e posição.");
      event.target.value = "";
    };

    reader.readAsDataURL(file);
  }

  function clearFormatting() {
    exec("removeFormat");
    exec("formatBlock", "p");
  }

  function newDocument() {
    const confirmed = window.confirm(
      "Criar um novo documento em branco? Salve a versão atual antes se quiser manter uma cópia.",
    );

    if (!confirmed) {
      return;
    }

    setTitle("Documento Planify");
    setDocumentSource(null);
    setEditorHtml(defaultDocument);
    setStatus("Novo documento criado.");
  }

  function printDocument() {
    persistCurrentDocument("Documento preparado para impressão limpa.");

    const cleanPrintHtml = wrapAsCleanPrintHtml(title, getEditorHtml(), {
      autoPrint: true,
    });
    const printWindow = window.open("", "_blank", "width=1024,height=720");

    if (!printWindow) {
      setStatus("Não foi possível abrir a janela limpa. Use Ctrl+P e desative cabeçalhos/rodapés do navegador, se necessário.");
      window.print();
      return;
    }

    printWindow.document.open();
    printWindow.document.write(cleanPrintHtml);
    printWindow.document.close();
    printWindow.focus();
    setStatus("PDF/impressão limpa preparado em uma nova janela.");
  }

  async function downloadHtml() {
    setStatus("Gerando HTML...");

    try {
      await downloadEditorExport({
        title: title.trim() || "Documento Planify",
        html: getEditorHtml(),
        format: "html",
        fallbackFileName: `${sanitizeFilename(title)}.html`,
      });
      setStatus("HTML baixado.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Erro ao baixar HTML.");
    }
  }

  async function downloadPdfReal() {
    const html = getEditorHtml();
    const hasText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    if (!hasText) {
      setStatus("Adicione conteúdo ao documento antes de exportar o PDF.");
      return;
    }

    setStatus("Gerando PDF... (pode levar até 1 minuto)");

    try {
      await downloadEditorExport({
        title: title.trim() || "Documento Planify",
        html: getEditorHtml(),
        format: "pdf",
        fallbackFileName: `${sanitizeFilename(title)}.pdf`,
        documentType: documentSource?.type,
      });
      setStatus("PDF baixado com proporção de slide.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Erro ao baixar PDF.");
    }
  }

  function copyHtml() {
    const html = getEditorHtml();

    navigator.clipboard
      .writeText(html)
      .then(() => setStatus("HTML copiado."))
      .catch(() => setStatus("Não foi possível copiar o HTML."));
  }

  function selectImage(image: HTMLImageElement) {
    if (selectedImageRef.current && selectedImageRef.current !== image) {
      clearImageOutline(selectedImageRef.current);
    }

    selectedImageRef.current = image;
    image.dataset.planifyImage = "true";
    image.style.maxWidth = "100%";
    image.style.height = "auto";
    image.style.cursor = "pointer";
    image.style.outline = "3px solid #22d3ee";
    image.style.outlineOffset = "4px";

    const width = Number.parseInt(image.style.width || "60", 10);

    setSelectedImageName(image.alt || "Imagem selecionada");
    setSelectedImageWidth(Number.isFinite(width) ? width : 60);
    setStatus("Imagem selecionada. Use os controles de tamanho e posição.");
  }

  function clearSelectedImage() {
    clearImageOutline(selectedImageRef.current);
    selectedImageRef.current = null;
    setSelectedImageName("");
  }

  function handleEditorClick(event: ReactMouseEvent<HTMLDivElement>) {
    const target = event.target;
    const editor = editorRef.current;

    if (target instanceof HTMLImageElement) {
      selectImage(target);
      clearSelectedTable();
      return;
    }

    if (editor && target instanceof HTMLElement) {
      const table = getClosestTable(target, editor);

      if (table) {
        selectTable(table);
        clearSelectedImage();
        return;
      }
    }

    if (!(target instanceof HTMLInputElement)) {
      clearSelectedImage();
      clearSelectedTable();
    }
  }

  function applyImageWidth(width: number) {
    const image = selectedImageRef.current;

    if (!image) {
      setStatus("Clique em uma imagem primeiro.");
      return;
    }

    const safeWidth = Math.max(10, Math.min(100, Math.round(width)));
    const figure = closestFigure(image);

    image.style.width = `${safeWidth}%`;
    image.style.maxWidth = "100%";
    image.style.height = "auto";
    figure.style.maxWidth = "100%";

    setSelectedImageWidth(safeWidth);
    persistCurrentDocument(`Imagem ajustada para ${safeWidth}%.`);
  }

  function alignSelectedImage(position: "left" | "center" | "right") {
    const image = selectedImageRef.current;

    if (!image) {
      setStatus("Clique em uma imagem primeiro.");
      return;
    }

    const figure = closestFigure(image);

    figure.style.float = "";
    figure.style.clear = "";
    figure.style.display = "block";
    figure.style.maxWidth = "100%";

    if (position === "left") {
      figure.style.margin = "16px auto 16px 0";
      figure.style.textAlign = "left";
    }

    if (position === "center") {
      figure.style.margin = "16px auto";
      figure.style.textAlign = "center";
    }

    if (position === "right") {
      figure.style.margin = "16px 0 16px auto";
      figure.style.textAlign = "right";
    }

    persistCurrentDocument("Posição da imagem ajustada.");
  }

  function floatSelectedImage(position: "left" | "right") {
    const image = selectedImageRef.current;

    if (!image) {
      setStatus("Clique em uma imagem primeiro.");
      return;
    }

    const figure = closestFigure(image);

    figure.style.float = position;
    figure.style.display = "block";
    figure.style.maxWidth = `${selectedImageWidth}%`;
    figure.style.margin =
      position === "left"
        ? "8px 18px 12px 0"
        : "8px 0 12px 18px";
    figure.style.textAlign = position;

    image.style.width = "100%";

    persistCurrentDocument(
      position === "left"
        ? "Imagem flutuando à esquerda."
        : "Imagem flutuando à direita.",
    );
  }

  function clearImageFloat() {
    const image = selectedImageRef.current;

    if (!image) {
      setStatus("Clique em uma imagem primeiro.");
      return;
    }

    const figure = closestFigure(image);

    figure.style.float = "";
    figure.style.clear = "both";
    figure.style.display = "block";
    figure.style.maxWidth = "100%";
    figure.style.margin = "16px auto";
    figure.style.textAlign = "center";

    image.style.width = `${selectedImageWidth}%`;
    image.style.maxWidth = "100%";
    image.style.height = "auto";

    persistCurrentDocument("Flutuação da imagem removida.");
  }

  function removeSelectedImage() {
    const image = selectedImageRef.current;

    if (!image) {
      setStatus("Clique em uma imagem primeiro.");
      return;
    }

    const confirmed = window.confirm("Remover esta imagem do documento?");

    if (!confirmed) {
      return;
    }

    const figure =
      image.closest("figure.planify-slide-figure") || image.closest("figure");

    if (figure) {
      figure.remove();
    } else {
      image.remove();
    }

    clearSelectedImage();
    updateWordCount();
    persistCurrentDocument("Imagem removida.");
  }

  const main = (
    <>
      {originHint ? (
        <div
          className={
            embedded
              ? "shrink-0 border-b border-slate-100 bg-slate-50/90 px-2 py-1 text-[10px] font-semibold leading-tight text-slate-900"
              : "mb-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900"
          }
        >
          {originHint}
        </div>
      ) : null}

      {planningBundle && planningBundle.tabs.length > 1 ? (
        <div
          className={`shrink-0 border-b border-cyan-200 bg-cyan-50/80 ${
            embedded ? "px-2 py-1.5" : "mb-2 rounded-xl border px-3 py-2"
          }`}
        >
          <div className="flex flex-wrap gap-2">
            {planningBundle.tabs.map((tab, index) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchPlanningBundleTab(index)}
                className={`rounded-lg px-3 py-1.5 text-xs font-black transition ${
                  index === activeBundleIndex
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "border border-cyan-200 bg-white text-slate-700 hover:border-cyan-400 hover:bg-cyan-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div
        className={`planify-editor-toolbar shrink-0 border-b border-slate-200 bg-white ${
          embedded ? "px-2 py-1.5" : "mb-2 rounded-xl border px-3 py-2 shadow-sm"
        }`}
      >
        {embedded ? (
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-1">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={() => persistCurrentDocument("Título salvo.")}
                aria-label="Título do documento"
                className="h-8 min-w-[7rem] flex-1 rounded-md border border-slate-200 bg-slate-50 px-2 text-[11px] font-bold text-slate-950 outline-none focus:border-blue-400 focus:bg-white"
              />
              <button
                type="button"
                onClick={saveVersion}
                className="shrink-0 rounded-md bg-gradient-to-r from-blue-600 to-slate-600 px-2.5 py-1.5 text-[11px] font-black text-white"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={downloadPdfReal}
                className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-black text-slate-700"
              >
                PDF
              </button>
              <button
                type="button"
                onClick={() => setShowMobileActions((value) => !value)}
                aria-label="Mais ações"
                aria-expanded={showMobileActions}
                className={`shrink-0 rounded-md border px-2 py-1.5 text-[11px] font-black ${
                  showMobileActions
                    ? "border-blue-300 bg-blue-50 text-blue-800"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                ⋯
              </button>
              <EditorShareBar
                compact
                title={title}
                getHtml={getEditorHtml}
                getPlanningPayload={getPlanningPayloadForExport}
                onStatus={setStatus}
                documentType={documentSource?.type}
                isSlideDeck={isSlideDeck}
                slideTheme={slideTheme}
              />
              <span className="shrink-0 text-[10px] font-bold text-slate-500">
                {wordCount} pal.
              </span>
            </div>

            {showMobileActions ? (
              <div className="flex flex-wrap gap-1">
                <button type="button" onClick={newDocument} className={actionBtnClass}>
                  Novo
                </button>
                <button
                  type="button"
                  onClick={() => setShowVersionsPanel((value) => !value)}
                  className={`${actionBtnClass} ${
                    showVersionsPanel ? "border-blue-300 bg-blue-50 text-blue-800" : ""
                  }`}
                >
                  Versões
                </button>
                <button
                  type="button"
                  onClick={() => setShowFormatTools((value) => !value)}
                  className={`${actionBtnClass} ${
                    showFormatTools ? "border-blue-300 bg-blue-50 text-blue-800" : ""
                  }`}
                >
                  Formatação
                </button>
              </div>
            ) : null}

            <p className="truncate text-[10px] leading-tight text-slate-500" title={status}>
              {status}
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={saveVersion}
                className="rounded-lg bg-gradient-to-r from-blue-600 to-slate-600 px-3 py-1.5 text-xs font-black text-white"
              >
                Salvar
              </button>
              <button type="button" onClick={newDocument} className={actionBtnClass}>
                Novo
              </button>
              <button type="button" onClick={downloadPdfReal} className={actionBtnClass}>
                PDF
              </button>
              {canElevateDocument ? (
                <button
                  type="button"
                  onClick={() => void elevarQualidadeDocumentoNoEditor()}
                  disabled={elevatingQuality}
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-black text-indigo-800 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {elevatingQuality ? "Elevando..." : "Elevar qualidade"}
                </button>
              ) : null}
              <EditorShareBar
                compact
                title={title}
                getHtml={getEditorHtml}
                getPlanningPayload={getPlanningPayloadForExport}
                onStatus={setStatus}
                documentType={documentSource?.type}
                isSlideDeck={isSlideDeck}
                slideTheme={slideTheme}
              />
              <span className="ml-auto text-[10px] font-bold text-slate-500">
                {wordCount} pal.
              </span>
            </div>
            <p className="mt-1 truncate text-[10px] text-slate-500" title={status}>
              {status}
            </p>
          </>
        )}
      </div>

      <div
        className={
          embedded
            ? "flex min-h-0 flex-1 overflow-hidden"
            : "grid gap-3 xl:grid-cols-[232px_1fr]"
        }
      >
        {!embedded ? (
          <aside className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">
                Documento
              </p>

              <label className="mt-2 grid gap-1">
                <span className="text-xs font-bold text-slate-700">Título</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  onBlur={() => persistCurrentDocument("Título salvo.")}
                  className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-950 outline-none transition focus:border-slate-950 focus:bg-white"
                />
              </label>

              <div className="mt-3 grid gap-1.5">
                <button
                  type="button"
                  onClick={saveVersion}
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-slate-600 px-3 py-2 text-xs font-black text-white transition hover:opacity-95"
                >
                  Salvar versão
                </button>

                <button type="button" onClick={newDocument} className={actionBtnClass}>
                  Novo documento
                </button>

                <button
                  type="button"
                  onClick={applyAbntToDocument}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition"
                >
                  Aplicar padrão ABNT
                </button>

                <button
                  type="button"
                  onClick={printDocument}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition"
                >
                  Imprimir / PDF limpo
                </button>

                <button type="button" onClick={downloadHtml} className={actionBtnClass}>
                  Baixar HTML
                </button>

                {canElevateDocument ? (
                  <button
                    type="button"
                    onClick={() => void elevarQualidadeDocumentoNoEditor()}
                    disabled={elevatingQuality}
                    className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-800 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {elevatingQuality ? "Elevando qualidade..." : "Elevar qualidade"}
                  </button>
                ) : null}
              </div>

              {typeof documentQualityScore === "number" ? (
                <div className="mt-3">
                  <MaterialQualityScoreBar
                    score={documentQualityScore}
                    issues={documentQualityIssues}
                    onElevate={
                      canElevateDocument
                        ? () => void elevarQualidadeDocumentoNoEditor()
                        : undefined
                    }
                    elevating={elevatingQuality}
                    compact
                  />
                </div>
              ) : null}

              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs leading-5 text-slate-600">
                <p className="line-clamp-2">{status}</p>
                <p className="mt-1 font-black text-slate-950">{wordCount} palavra(s)</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">
                Versões salvas
              </p>

              <div className="mt-2 grid gap-2">
                {savedDocuments.length > 0 ? (
                  savedDocuments.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-2.5"
                    >
                      <button
                        type="button"
                        onClick={() => loadVersion(item)}
                        className="text-left text-sm font-black text-slate-950 hover:text-blue-700"
                      >
                        {item.title}
                      </button>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Intl.DateTimeFormat("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(item.updatedAt))}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeVersion(item.id)}
                        className="mt-3 text-xs font-black text-rose-700 hover:text-rose-800"
                      >
                        Remover
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-7 text-slate-600">
                    Nenhuma versão salva ainda.
                  </p>
                )}
              </div>
            </div>
          </aside>
        ) : null}

        {embedded && showVersionsPanel ? (
          <aside className="w-52 shrink-0 overflow-y-auto overscroll-contain border-r border-slate-200 bg-slate-50/80 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">
              Versões
            </p>
            <div className="mt-3 grid gap-2">
              {savedDocuments.length > 0 ? (
                savedDocuments.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white p-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => loadVersion(item)}
                      className="text-left text-xs font-black text-slate-950 hover:text-blue-700"
                    >
                      {item.title}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeVersion(item.id)}
                      className="mt-2 text-[10px] font-black text-rose-700"
                    >
                      Remover
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">Nenhuma versão salva.</p>
              )}
            </div>
          </aside>
        ) : null}

        <div
          className={
            embedded
              ? "flex min-h-0 min-w-0 flex-1 flex-col gap-1 overflow-hidden"
              : "space-y-2"
          }
        >
          {embedded && !showFormatTools ? (
            <div className="sticky top-0 z-20 flex shrink-0 items-center gap-1 overflow-x-auto overscroll-contain rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-sm backdrop-blur lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button type="button" onClick={undoEdit} className={toolBtnClass} aria-label="Desfazer">
                ↶
              </button>
              <button type="button" onClick={redoEdit} className={toolBtnClass} aria-label="Refazer">
                ↷
              </button>
              <button
                type="button"
                onClick={() => exec("bold")}
                className={toolBtnClass}
                aria-label="Negrito"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => exec("italic")}
                className={toolBtnClass}
                aria-label="Itálico"
              >
                I
              </button>
              <button
                type="button"
                onClick={deleteSelectionOrBlock}
                className={`${toolBtnClass} border-rose-200 bg-rose-50 text-rose-700`}
                aria-label="Excluir"
              >
                🗑
              </button>
              <button
                type="button"
                onClick={() => setShowFormatTools(true)}
                className={`${toolBtnClass} border-blue-200 bg-blue-50 text-blue-800`}
              >
                Aa+
              </button>
            </div>
          ) : null}

          {isSlideDeck && materialMeta?.generationPayload ? (
            <div className="shrink-0">
              <SlideAiAdjustPanel
                generationPayload={materialMeta.generationPayload}
                disabled={adjustingSlides || elevatingQuality}
                compact={embedded}
                onAdjusting={setAdjustingSlides}
                onResult={handleSlideAiAdjustResult}
                onError={(message) => setStatus(message)}
              />
            </div>
          ) : null}

          {isTableActive ? (
            <div className="hidden shrink-0 rounded-lg border border-cyan-200 bg-cyan-50 px-2 py-1 lg:block">
              <div className="flex flex-wrap items-center gap-1">
                <span className="mr-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-800">
                  Tabela
                </span>
                <button
                  type="button"
                  onClick={() => removeCurrentTable(true)}
                  className="h-7 rounded-md border border-rose-200 bg-rose-50 px-2 text-[10px] font-black text-rose-700"
                >
                  Excluir tabela
                </button>
                <button
                  type="button"
                  onClick={removeTableRow}
                  className="h-7 rounded-md border border-cyan-200 bg-white px-2 text-[10px] font-black text-cyan-800"
                >
                  Remover linha
                </button>
                <button
                  type="button"
                  onClick={removeTableColumn}
                  className="h-7 rounded-md border border-cyan-200 bg-white px-2 text-[10px] font-black text-cyan-800"
                >
                  Remover coluna
                </button>
              </div>
            </div>
          ) : null}

          {(!embedded || showFormatTools) && (
          <div
            className={`planify-editor-format-panel relative shrink-0 rounded-lg border border-slate-200 bg-white shadow-sm ${
              embedded
                ? "max-lg:max-h-[min(38dvh,280px)] max-lg:overflow-y-auto max-lg:overscroll-contain overflow-x-auto overscroll-contain p-1 lg:p-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                : "overflow-x-auto p-2"
            }`}
          >
            {embedded && showFormatTools ? (
              <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-100 pb-2 lg:hidden">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Formatação
                </span>
                <button
                  type="button"
                  onClick={() => setShowFormatTools(false)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-700"
                >
                  Fechar
                </button>
              </div>
            ) : null}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelected}
            />

            <div
              className={`flex items-center gap-1 ${
                embedded ? "flex-nowrap lg:flex-nowrap" : "flex-wrap"
              }`}
            >
              <select
                value={selectedBlock}
                onChange={(event) => handleBlockChange(event.target.value)}
                className={toolSelectClass}
              >
                <option value="p">Parágrafo</option>
                <option value="h1">Título 1</option>
                <option value="h2">Título 2</option>
                <option value="h3">Título 3</option>
                <option value="blockquote">Citação</option>
                <option value="pre">Código/Bloco</option>
              </select>

              <select
                value={fontFamily}
                onChange={(event) => applyFontFamily(event.target.value)}
                className={toolSelectClass}
              >
                {fontOptions.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>

              <select
                value={fontSizePt}
                onChange={(event) => applyFontSize(event.target.value)}
                className={toolSelectClass}
              >
                {fontSizeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <select
                value={lineHeight}
                onChange={(event) => applyLineHeight(event.target.value)}
                className={toolSelectClass}
              >
                {lineHeightOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    Linha {item.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={undoEdit}
                aria-label="Desfazer"
                title="Desfazer"
                className={toolBtnClass}
              >
                ↶
              </button>
              <button
                type="button"
                onClick={redoEdit}
                aria-label="Refazer"
                title="Refazer"
                className={toolBtnClass}
              >
                ↷
              </button>
              <button
                type="button"
                onClick={deleteSelectionOrBlock}
                aria-label="Excluir seleção"
                title="Excluir"
                className={`${toolBtnClass} border-rose-200 bg-rose-50 text-rose-700`}
              >
                🗑
              </button>

              {[
                ["B", "bold", "Negrito"],
                ["I", "italic", "Itálico"],
                ["U", "underline", "Sublinhado"],
                ["S", "strikeThrough", "Riscado"],
              ].map(([label, command, aria]) => (
                <button
                  key={command}
                  type="button"
                  onClick={() => exec(command)}
                  aria-label={aria}
                  className={`${toolBtnClass} hover:text-slate-950`}
                >
                  {label}
                </button>
              ))}

              <button type="button" onClick={insertHyperlink} className={toolBtnClass}>
                Link
              </button>

              <button type="button" onClick={() => exec("outdent")} className={toolBtnClass}>
                ⇤
              </button>
              <button type="button" onClick={() => exec("indent")} className={toolBtnClass}>
                ⇥
              </button>

              <div className={`${embedded ? "h-6" : "h-7"} w-px shrink-0 bg-slate-200`} />

              {[
                ["•", "insertUnorderedList", "Lista com marcadores"],
                ["1.", "insertOrderedList", "Lista numerada"],
                ["←", "justifyLeft", "Alinhar à esquerda"],
                ["↔", "justifyCenter", "Centralizar"],
                ["→", "justifyRight", "Alinhar à direita"],
                ["☰", "justifyFull", "Justificar"],
              ].map(([label, command, aria]) => (
                <button
                  key={command}
                  type="button"
                  onClick={() => exec(command)}
                  aria-label={aria}
                  className={`${toolBtnClass} hover:text-slate-950`}
                >
                  {label}
                </button>
              ))}

              <label
                className={`flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 font-black text-slate-700 ${
                  embedded ? "h-7 text-[10px]" : "h-9 text-[10px]"
                }`}
              >
                Cor
                <input
                  type="color"
                  onChange={(event) => exec("foreColor", event.target.value)}
                  className="h-6 w-8 cursor-pointer border-0 bg-transparent"
                />
              </label>

              <label
                className={`flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 font-black text-slate-700 ${
                  embedded ? "h-7 text-[10px]" : "h-9 text-[10px]"
                }`}
              >
                Fundo
                <input
                  type="color"
                  onChange={(event) => exec("hiliteColor", event.target.value)}
                  className="h-6 w-8 cursor-pointer border-0 bg-transparent"
                />
              </label>

              <button type="button" onClick={insertTable} className={toolBtnClass}>
                Tabela
              </button>

              {isTableActive ? (
                <>
                  <button
                    type="button"
                    onClick={() => removeCurrentTable(true)}
                    className={`${toolBtnClass} border-rose-200 bg-rose-50 text-rose-700`}
                  >
                    ⊟ Tabela
                  </button>
                  <button type="button" onClick={removeTableRow} className={toolBtnClass}>
                    − Linha
                  </button>
                  <button type="button" onClick={removeTableColumn} className={toolBtnClass}>
                    − Col.
                  </button>
                </>
              ) : null}

              <button type="button" onClick={triggerImagePicker} className={toolBtnClass}>
                Imagem
              </button>

              <button type="button" onClick={insertDivider} className={toolBtnClass}>
                Linha
              </button>

              <button type="button" onClick={insertPageBreak} className={toolBtnClass}>
                Quebra
              </button>

              <button
                type="button"
                onClick={clearFormatting}
                className={`${toolBtnClass} border-amber-200 bg-amber-50 text-amber-700`}
              >
                Limpar
              </button>

              <button
                type="button"
                onClick={() => setShowAdvancedTools((value) => !value)}
                className={`${toolBtnClass} ${
                  showAdvancedTools ? "border-blue-300 bg-blue-50 text-blue-800" : ""
                }`}
              >
                ABNT+
              </button>
            </div>

            {showAdvancedTools ? (
            <div className={`rounded-2xl border border-emerald-200 bg-emerald-50 ${embedded ? "mt-2 p-2" : "mt-3 p-3"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  ABNT
                </span>

                <button
                  type="button"
                  onClick={applyNormalAbnt}
                  className="h-9 rounded-xl border border-emerald-200 bg-white px-3 text-xs font-black text-emerald-700 transition"
                >
                  Texto normal
                </button>

                <button
                  type="button"
                  onClick={applyTitleAbnt}
                  className="h-9 rounded-xl border border-emerald-200 bg-white px-3 text-xs font-black text-emerald-700 transition"
                >
                  Título
                </button>

                <button
                  type="button"
                  onClick={applyCitationAbnt}
                  className="h-9 rounded-xl border border-emerald-200 bg-white px-3 text-xs font-black text-emerald-700 transition"
                >
                  Citação
                </button>

                <button
                  type="button"
                  onClick={() => applyParagraphSpacing(0, 10)}
                  className="h-9 rounded-xl border border-emerald-200 bg-white px-3 text-xs font-black text-emerald-700 transition"
                >
                  Espaço padrão
                </button>

                <label className="flex h-9 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 text-xs font-black text-emerald-700">
                  Antes
                  <input
                    type="number"
                    min={0}
                    max={72}
                    value={spacingBefore}
                    onChange={(event) =>
                      applyParagraphSpacing(Number(event.target.value), spacingAfter)
                    }
                    className="h-7 w-14 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-950 outline-none"
                  />
                </label>

                <label className="flex h-9 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 text-xs font-black text-emerald-700">
                  Depois
                  <input
                    type="number"
                    min={0}
                    max={72}
                    value={spacingAfter}
                    onChange={(event) =>
                      applyParagraphSpacing(spacingBefore, Number(event.target.value))
                    }
                    className="h-7 w-14 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-950 outline-none"
                  />
                </label>

                <label className="flex h-9 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 text-xs font-black text-emerald-700">
                  Recuo 1ª linha
                  <input
                    type="number"
                    min={0}
                    max={4}
                    step={0.25}
                    value={firstLineIndent}
                    onChange={(event) => applyFirstLineIndent(Number(event.target.value))}
                    className="h-7 w-16 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-950 outline-none"
                  />
                  cm
                </label>
              </div>
            </div>
            ) : null}

            {showAdvancedTools ? (
            <div className={`rounded-2xl border border-blue-200 bg-blue-50 ${embedded ? "mt-2 p-2" : "mt-3 p-3"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                  Imagem
                </span>

                {selectedImageName ? (
                  <span className="max-w-56 truncate rounded-xl bg-white px-3 py-2 text-xs font-bold text-blue-700 border border-cyan-200">
                    {selectedImageName}
                  </span>
                ) : (
                  <span className="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-xs font-bold text-slate-500">
                    Clique em uma imagem para ajustar
                  </span>
                )}

                {[25, 40, 50, 60, 75, 100].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => applyImageWidth(size)}
                    className="h-9 rounded-xl border border-cyan-200 bg-white px-3 text-xs font-black text-blue-700 transition"
                  >
                    {size}%
                  </button>
                ))}

                <label className="flex h-9 items-center gap-2 rounded-xl border border-cyan-200 bg-white px-3 text-xs font-black text-blue-700">
                  Largura
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={selectedImageWidth}
                    onChange={(event) => applyImageWidth(Number(event.target.value))}
                    className="h-7 w-16 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-950 outline-none"
                  />
                  %
                </label>

                <button
                  type="button"
                  onClick={() => alignSelectedImage("left")}
                  className="h-9 rounded-xl border border-cyan-200 bg-white px-3 text-xs font-black text-blue-700 transition"
                >
                  Esq.
                </button>

                <button
                  type="button"
                  onClick={() => alignSelectedImage("center")}
                  className="h-9 rounded-xl border border-cyan-200 bg-white px-3 text-xs font-black text-blue-700 transition"
                >
                  Centro
                </button>

                <button
                  type="button"
                  onClick={() => alignSelectedImage("right")}
                  className="h-9 rounded-xl border border-cyan-200 bg-white px-3 text-xs font-black text-blue-700 transition"
                >
                  Dir.
                </button>

                <button
                  type="button"
                  onClick={() => floatSelectedImage("left")}
                  className="h-9 rounded-xl border border-cyan-200 bg-white px-3 text-xs font-black text-blue-700 transition"
                >
                  Texto à direita
                </button>

                <button
                  type="button"
                  onClick={() => floatSelectedImage("right")}
                  className="h-9 rounded-xl border border-cyan-200 bg-white px-3 text-xs font-black text-blue-700 transition"
                >
                  Texto à esquerda
                </button>

                <button
                  type="button"
                  onClick={clearImageFloat}
                  className="h-9 rounded-xl border border-cyan-200 bg-white px-3 text-xs font-black text-blue-700 transition"
                >
                  Normal
                </button>

                <button
                  type="button"
                  onClick={removeSelectedImage}
                  className="h-9 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-black text-rose-700 transition"
                >
                  Remover
                </button>
              </div>
            </div>
            ) : null}
          </div>
          )}

          <div
            className={`planify-editor-document-scroll min-h-0 flex-1 rounded-lg border border-slate-200 bg-white shadow-sm ${
              embedded
                ? "overflow-y-auto overscroll-contain p-0.5 sm:p-1"
                : "overflow-y-auto overscroll-contain p-1 sm:p-2"
            }`}
          >
            <div
              className={`bg-slate-100 ${
                embedded ? "rounded-md p-1 sm:p-1.5" : "rounded-xl p-1.5 sm:p-2"
              }`}
            >
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onClick={handleEditorClick}
                onInput={() => {
                  prepareImagesInsideEditor();
                  updateWordCount();
                  scheduleUndoSnapshot();
                  persistCurrentDocument("Editando...");
                }}
                onBlur={() => persistCurrentDocument("Documento salvo.")}
                className={`planify-editor-page mx-auto w-full rounded-sm bg-white text-slate-950 shadow-md outline-none ${
                  isSlideDeck
                    ? "max-w-[min(100%,60rem)] px-3 py-4 sm:px-4 sm:py-5"
                    : embedded
                      ? "max-w-[21cm] min-h-[36vh] px-3 py-4 sm:min-h-0 sm:px-5 sm:py-6"
                      : "max-w-[21cm] min-h-[50vh] px-4 py-5 sm:min-h-[29.7cm] sm:px-6 sm:py-8 md:px-[1.75cm] md:py-[1.75cm] md:shadow-lg"
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const editorStyles = (
      <style jsx global>{`
        .planify-editor-page {
          font-family: "Times New Roman", Times, serif;
          font-size: 12pt;
          line-height: 1.5;
        }

        .planify-editor-page.planify-abnt-page {
          padding: 3cm 2cm 2cm 3cm !important;
          text-align: justify;
        }

        .planify-editor-page h1 {
          font-size: 2rem;
          font-weight: 800;
          margin: 0 0 1rem;
        }

        .planify-editor-page h2 {
          font-size: 1.55rem;
          font-weight: 800;
          margin: 1.25rem 0 0.75rem;
        }

        .planify-editor-page h3 {
          font-size: 1.25rem;
          font-weight: 800;
          margin: 1rem 0 0.5rem;
        }

        .planify-editor-page p {
          margin: 0.65rem 0;
        }

        .planify-editor-page ul,
        .planify-editor-page ol {
          margin: 0.75rem 0;
          padding-left: 1.5rem;
        }

        .planify-editor-page table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }

        .planify-editor-page td,
        .planify-editor-page th {
          border: 1px solid #cbd5e1;
          padding: 0.55rem;
          vertical-align: top;
        }

        .planify-editor-page img {
          max-width: 100%;
          height: auto;
          cursor: pointer;
        }

        .planify-editor-page figure {
          max-width: 100%;
          break-inside: avoid;
        }

        .planify-editor-page figure::after {
          content: "";
          display: table;
          clear: both;
        }

        .planify-editor-page blockquote {
          border-left: 4px solid #38bdf8;
          margin: 1rem 0;
          padding: 0.5rem 1rem;
          background: #f8fafc;
        }

        .planify-editor-page .page-break {
          page-break-after: always;
          border: 0;
          border-top: 2px dashed #94a3b8;
          margin: 2rem 0;
        }

        @media (max-width: 640px) {
          .planify-editor-page.planify-abnt-page {
            padding: 1rem !important;
          }

          .planify-editor-page .planify-flashcards {
            display: flex !important;
            flex-direction: column !important;
            gap: 12px !important;
          }

          .planify-editor-page .planify-flashcard {
            flex: none !important;
            min-width: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }

          .planify-editor-page .planify-slide-deck {
            display: block !important;
          }

          .planify-editor-page .planify-slide {
            margin-bottom: 14px !important;
            border-radius: 14px !important;
          }

          .planify-editor-page .planify-slide figure img,
          .planify-editor-page .planify-slide-image {
            max-height: 180px !important;
            object-fit: cover;
          }

          .planify-editor-page table {
            display: block;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            max-width: 100%;
          }

          .planify-editor-page td,
          .planify-editor-page th {
            min-width: 72px;
            font-size: 0.85rem;
            padding: 0.4rem;
          }
        }

        @page {
          size: A4 portrait;
          margin: 1.2cm;
        }

        @media print {
          body {
            background: #ffffff !important;
          }

          body * {
            visibility: hidden !important;
          }

          .planify-editor-page,
          .planify-editor-page * {
            visibility: visible !important;
          }

          .planify-editor-page {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          .planify-editor-page table,
          .planify-editor-page figure,
          .planify-editor-page img,
          .planify-editor-page blockquote {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
  );

  if (embedded) {
    return (
      <div className="planify-editor-embedded flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-slate-50">
        {main}
        {editorStyles}
      </div>
    );
  }

  return (
    <PlanifyWorkspacePane
      header={
        <PlanifyPageHero
          badge="Editor"
          icon="editor"
          title="Finalize, formate e exporte"
          description="Documentos pedagógicos com tabelas, imagens e versões salvas no navegador."
        />
      }
    >
      {main}
      {editorStyles}
    </PlanifyWorkspacePane>
  );
}

export default EditorClient;
