"use client";

import { EditorShareBar } from "@/components/editor/EditorShareBar";
import { PlanifyWorkspacePane } from "@/components/pro/PlanifyWorkspacePane";
import { PlanifyPageHero } from "@/components/pro/PlanifyPageHero";
import {
  ChangeEvent,
  MouseEvent as ReactMouseEvent,
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

function downloadBlob(filename: string, mimeType: string, content: BlobPart) {
  const blob = new Blob([content], { type: mimeType });
  downloadExistingBlob(filename, blob);
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function wrapAsCleanPrintHtml(title: string, body: string) {
  const safeTitle = escapeHtml(title || "Documento Planify");

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  <style>
    @page { size: A4 portrait; margin: 1.2cm; }
    html, body { background: #ffffff; color: #0f172a; margin: 0; }
    body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5; }
    .planify-print-document { width: 100%; max-width: 18.6cm; margin: 0 auto; }
    h1, h2, h3 { color: #0f172a; line-height: 1.2; page-break-after: avoid; }
    p { margin: 0 0 0.65rem; }
    table { width: 100%; border-collapse: collapse; margin: 0.8rem 0; page-break-inside: avoid; }
    td, th { border: 1px solid #cbd5e1; padding: 0.45rem; vertical-align: top; }
    figure, img, table, blockquote, .planify-game-card, .planify-game-board, .planify-bingo-card, .planify-memory-card, .planify-domino-piece { break-inside: avoid; page-break-inside: avoid; }
    img { max-width: 100%; height: auto; }
    .page-break { break-after: page; page-break-after: always; border: 0; }
    [contenteditable], button, input, select, textarea { outline: 0 !important; }
    @media print {
      html, body { width: 210mm; min-height: 297mm; }
      .planify-print-document { max-width: none; }
    }
  </style>
</head>
<body>
  <main class="planify-print-document">
    ${body}
  </main>
  <script>
    window.addEventListener("load", function () {
      window.setTimeout(function () { window.print(); }, 250);
    });
  </script>
</body>
</html>`;
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

function wrapAsFullHtml(title: string, body: string) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 12pt;
      color: #0f172a;
      line-height: 1.5;
      margin: 3cm 2cm 2cm 3cm;
      text-align: justify;
    }

    h1, h2, h3 {
      color: #0f172a;
      line-height: 1.2;
      font-weight: 700;
      text-align: left;
    }

    h1 {
      font-size: 14pt;
      text-transform: uppercase;
      text-align: center;
      margin: 0 0 24pt;
    }

    h2 {
      font-size: 13pt;
      margin: 18pt 0 12pt;
    }

    h3 {
      font-size: 12pt;
      margin: 14pt 0 8pt;
    }

    p {
      margin: 0 0 10pt;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      text-align: left;
    }

    td, th {
      border: 1px solid #cbd5e1;
      padding: 8px;
      vertical-align: top;
    }

    img {
      max-width: 100%;
      height: auto;
    }

    figure {
      break-inside: avoid;
    }

    blockquote {
      margin: 12pt 0 12pt 4cm;
      font-size: 10pt;
      line-height: 1;
      text-align: justify;
    }

    .page-break {
      page-break-after: always;
      border: 0;
      border-top: 2px dashed #94a3b8;
      margin: 32px 0;
    }

    @page {
      size: A4;
      margin: 3cm 2cm 2cm 3cm;
    }
  </style>
</head>
<body>
${body}
</body>
</html>`;
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
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);

  const lastSavedLabel = useMemo(() => nowLabel(), []);

  const toolBtnClass = embedded
    ? "h-8 min-w-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-black text-slate-700 transition hover:border-slate-950"
    : "h-10 min-w-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 transition hover:border-slate-950";

  const toolSelectClass = embedded
    ? "h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-bold text-slate-950 outline-none focus:border-slate-950"
    : "h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-950 outline-none focus:border-slate-950";

  const actionBtnClass = embedded
    ? "rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-black text-slate-700 transition hover:border-slate-950"
    : "rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-slate-950";

  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get("from");
    if (from === "materiais") {
      setOriginHint(
        "Material didático recebido do gerador — ajuste o texto, complemente e exporte em DOCX quando estiver pronto.",
      );
    } else if (from === "planejamentos") {
      setOriginHint("Planejamento recebido — revise a formatação antes de exportar.");
    }
  }, []);

  useEffect(() => {
    const initial = loadInitialDocument();

    setTitle(initial.title);
    setDocumentSource(initial.storedDocument);
    setSavedDocuments(loadSavedDocuments());

    if (editorRef.current) {
      editorRef.current.innerHTML = initial.html;
      prepareImagesInsideEditor();
      updateWordCount();
    }

    setIsLoaded(true);
    setStatus(`Documento carregado. Última verificação: ${lastSavedLabel}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const timer = window.setTimeout(() => {
      persistCurrentDocument("Salvo automaticamente.");
    }, 1200);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, wordCount, isLoaded]);

  function focusEditor() {
    editorRef.current?.focus();
  }

  function getEditorHtml() {
    return editorRef.current?.innerHTML || "";
  }

  function setEditorHtml(html: string) {
    clearSelectedImage();

    if (editorRef.current) {
      editorRef.current.innerHTML = html;
      prepareImagesInsideEditor();
      updateWordCount();
      persistCurrentDocument("Documento carregado.");
    }
  }

  function updateWordCount() {
    const text = editorRef.current?.innerText || "";
    const words = text
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    setWordCount(words.length);
  }

  function exec(command: string, value?: string) {
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
    exec("undo");
  }

  function redoEdit() {
    exec("redo");
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

  function persistCurrentDocument(message = "Documento salvo.") {
    if (typeof window === "undefined") {
      return;
    }

    prepareImagesInsideEditor();

    const html = getEditorHtml();
    const currentTitle = title.trim() || getDocumentTitleFromHtml(html);

    const source = documentSource;

    window.localStorage.setItem(
      STORAGE_DOCUMENT_KEY,
      JSON.stringify({
        type: source?.type || "editor",
        title: currentTitle,
        html,
        content: html,
        payload: source?.payload,
        updatedAt: new Date().toISOString(),
      }),
    );

    window.localStorage.setItem(STORAGE_CONTENT_KEY, html);
    setStatus(`${message} ${nowLabel()}`);
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

    const cleanPrintHtml = wrapAsCleanPrintHtml(title, getEditorHtml());
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

  function downloadHtml() {
    const html = wrapAsFullHtml(title, getEditorHtml());
    const filename = `${sanitizeFilename(title)}.html`;

    downloadBlob(filename, "text/html;charset=utf-8", html);
    setStatus("HTML baixado.");
  }

  function editorSectionsFromHtml(html: string) {
    const parser = new DOMParser();
    const document = parser.parseFromString(html, "text/html");
    const content = document.body.innerText.replace(/\n{3,}/g, "\n\n").trim();

    return [
      {
        title: "Conteúdo editado",
        content: content || "Documento sem conteúdo.",
      },
    ];
  }

  async function downloadDocxReal() {
    setStatus("Gerando DOCX real...");

    try {
      const source = documentSource;
      const isOfficialPlanning =
        source?.type === "planejamento" &&
        source.payload &&
        typeof source.payload === "object" &&
        "matrizPlanejamento" in source.payload;

      const response = isOfficialPlanning
        ? await fetch("/api/planejamentos/docx-oficial", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(source.payload),
          })
        : await fetch("/api/documentos/docx", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kind: "generic",
              document: {
                title: title.trim() || "Documento Planify",
                subtitle: "Documento editado no Editor Planify",
                badge: "Planify",
                sections: editorSectionsFromHtml(getEditorHtml()),
                filename: sanitizeFilename(title),
              },
            }),
          });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message || "Não foi possível gerar o DOCX real.");
      }

      const blob = await response.blob();
      const fallback = `${sanitizeFilename(title)}.docx`;
      const filename = filenameFromResponse(response, fallback);

      downloadExistingBlob(filename, blob);
      setStatus(
        isOfficialPlanning
          ? "DOCX oficial baixado a partir da matriz do planejamento."
          : "DOCX real baixado.",
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Erro ao baixar DOCX real.");
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

    if (target instanceof HTMLImageElement) {
      selectImage(target);
      return;
    }

    if (!(target instanceof HTMLInputElement)) {
      clearSelectedImage();
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
              ? "shrink-0 border-b border-slate-100 bg-slate-50/90 px-3 py-2 text-xs font-semibold text-slate-900"
              : "mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900"
          }
        >
          {originHint}
        </div>
      ) : null}

      <div
        className={`shrink-0 border-b border-slate-200 bg-white ${
          embedded ? "px-3 py-2" : "mb-4 rounded-2xl border px-4 py-3 shadow-sm"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          {embedded ? (
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onBlur={() => persistCurrentDocument("Título salvo.")}
              aria-label="Título do documento"
              className="h-8 min-w-[140px] flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-950 outline-none focus:border-blue-400 focus:bg-white"
            />
          ) : null}

          <button
            type="button"
            onClick={saveVersion}
            className={
              embedded
                ? "rounded-lg bg-gradient-to-r from-blue-600 to-slate-600 px-3 py-1.5 text-xs font-black text-white"
                : "rounded-xl bg-gradient-to-r from-blue-600 to-slate-600 px-4 py-2 text-sm font-black text-white"
            }
          >
            Salvar
          </button>

          <button type="button" onClick={newDocument} className={actionBtnClass}>
            Novo
          </button>

          <button type="button" onClick={downloadDocxReal} className={actionBtnClass}>
            DOCX
          </button>

          <button type="button" onClick={printDocument} className={actionBtnClass}>
            PDF
          </button>

          {embedded ? (
            <>
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
            </>
          ) : null}

          <EditorShareBar
            title={title}
            getHtml={getEditorHtml}
            onStatus={setStatus}
          />

          <span className="ml-auto text-[11px] font-bold text-slate-500">
            {wordCount} pal.
          </span>
        </div>
        <p className={`truncate text-slate-500 ${embedded ? "mt-1 text-[11px]" : "mt-2 text-xs"}`}>
          {status}
        </p>
      </div>

      <div
        className={
          embedded
            ? "flex h-full min-h-0 flex-1 overflow-hidden"
            : "grid gap-6 xl:grid-cols-[280px_1fr]"
        }
      >
        {!embedded ? (
          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-blue-700">
                Documento
              </p>

              <label className="mt-4 grid gap-2">
                <span className="text-sm font-bold text-slate-700">Título</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  onBlur={() => persistCurrentDocument("Título salvo.")}
                  className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-slate-950 focus:bg-white"
                />
              </label>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={saveVersion}
                  className="rounded-2xl bg-gradient-to-r from-blue-600 to-slate-600 px-5 py-3 text-sm font-black text-white transition hover:opacity-95"
                >
                  Salvar versão
                </button>

                <button type="button" onClick={newDocument} className={actionBtnClass}>
                  Novo documento
                </button>

                <button
                  type="button"
                  onClick={applyAbntToDocument}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 transition"
                >
                  Aplicar padrão ABNT
                </button>

                <button
                  type="button"
                  onClick={printDocument}
                  className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 transition"
                >
                  Imprimir / PDF limpo
                </button>

                <button
                  type="button"
                  onClick={downloadDocxReal}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 transition"
                >
                  Baixar DOCX real
                </button>

                <button type="button" onClick={downloadHtml} className={actionBtnClass}>
                  Baixar HTML
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                <p>{status}</p>
                <p className="mt-2 font-black text-slate-950">{wordCount} palavra(s)</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-blue-700">
                Versões salvas
              </p>

              <div className="mt-4 grid gap-3">
                {savedDocuments.length > 0 ? (
                  savedDocuments.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
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
              ? "flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden"
              : "space-y-5"
          }
        >
          {(!embedded || showFormatTools) && (
          <div
            className={`relative shrink-0 rounded-[2rem] border border-slate-200 bg-white shadow-sm ${
              embedded ? "overflow-x-auto overscroll-contain p-2" : "p-4"
            }`}
          >
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelected}
            />

            <div className="flex flex-wrap items-center gap-1.5">
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
                className={toolBtnClass}
              >
                ↶
              </button>
              <button
                type="button"
                onClick={redoEdit}
                aria-label="Refazer"
                className={toolBtnClass}
              >
                ↷
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

              <div className="h-8 w-px bg-slate-200" />

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
                className={`flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 font-black text-slate-700 ${
                  embedded ? "h-8 text-[10px]" : "h-10 text-xs"
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
                className={`flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 font-black text-slate-700 ${
                  embedded ? "h-8 text-[10px]" : "h-10 text-xs"
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
            className={`min-h-0 flex-1 rounded-[2rem] border border-slate-200 bg-white shadow-sm ${
              embedded ? "overflow-y-auto overscroll-contain p-2" : "p-3"
            }`}
          >
            <div className="rounded-[1.5rem] bg-slate-100 p-3 sm:p-6">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onClick={handleEditorClick}
                onInput={() => {
                  prepareImagesInsideEditor();
                  updateWordCount();
                  persistCurrentDocument("Editando...");
                }}
                onBlur={() => persistCurrentDocument("Documento salvo.")}
                className="planify-editor-page mx-auto min-h-[29.7cm] w-full max-w-[21cm] rounded-sm bg-white px-[2cm] py-[2cm] text-slate-950 shadow-2xl outline-none sm:px-[2cm] sm:py-[2cm]"
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
      <div className="planify-editor-embedded flex h-full min-h-0 w-full flex-col overflow-hidden bg-slate-50">
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
