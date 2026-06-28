let savedSelection: Range | null = null;

type ToolbarPointerEvent = {
  preventDefault: () => void;
};

export function saveEditorSelection(): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  savedSelection = selection.getRangeAt(0).cloneRange();
}

export function restoreEditorSelection(): void {
  if (!savedSelection) return;
  const selection = window.getSelection();
  if (!selection) return;
  selection.removeAllRanges();
  selection.addRange(savedSelection);
}

export function preventToolbarFocusLoss(event: ToolbarPointerEvent): void {
  event.preventDefault();
  saveEditorSelection();
}

export function isSlideEditorImage(image: HTMLImageElement): boolean {
  return (
    image.classList.contains("planify-slide-image") ||
    Boolean(image.closest("figure.planify-slide-figure, .planify-slide-deck"))
  );
}

export function isEditableUserFigure(image: HTMLImageElement): boolean {
  if (isSlideEditorImage(image)) return false;
  const figure = image.closest("figure");
  return (
    figure?.classList.contains("planify-user-figure") === true ||
    figure?.getAttribute("data-planify-figure") === "true" ||
    !figure
  );
}

export function isEditableUserFigureElement(figure: HTMLElement | null): boolean {
  if (!figure || figure.tagName.toLowerCase() !== "figure") return false;
  if (
    figure.classList.contains("planify-slide-figure") ||
    figure.closest(".planify-slide-deck")
  ) {
    return false;
  }
  return (
    figure.classList.contains("planify-user-figure") ||
    figure.getAttribute("data-planify-figure") === "true"
  );
}

/** Wrap or tag non-slide images so resize/drag/toolbar work in the editor. */
export function ensureEditableUserFigure(
  image: HTMLImageElement,
  editor: HTMLElement,
): HTMLElement {
  if (isSlideEditorImage(image) || !editor.contains(image)) {
    return image.closest("figure") instanceof HTMLElement
      ? (image.closest("figure") as HTMLElement)
      : image;
  }

  let figure = image.closest("figure");

  if (!(figure instanceof HTMLElement)) {
    figure = document.createElement("figure");
    figure.className = "planify-user-figure";
    figure.setAttribute("data-planify-figure", "true");
    const parent = image.parentNode;
    if (parent) {
      parent.insertBefore(figure, image);
      figure.appendChild(image);
    } else {
      editor.appendChild(figure);
      figure.appendChild(image);
    }
  } else if (!isEditableUserFigureElement(figure)) {
    figure.classList.add("planify-user-figure");
    figure.setAttribute("data-planify-figure", "true");
  }

  figure.setAttribute("contenteditable", "false");
  figure.setAttribute("draggable", "true");
  figure.style.maxWidth = figure.style.maxWidth || "100%";
  if (!figure.style.textAlign) {
    figure.style.textAlign = "center";
  }
  if (!figure.style.display) {
    figure.style.display = "block";
  }
  if (!figure.style.position) {
    figure.style.position = "relative";
  }

  image.dataset.planifyImage = "true";
  image.style.maxWidth = image.style.maxWidth || "100%";
  image.style.height = image.style.height || "auto";
  if (!image.style.width) {
    image.style.width = "60%";
  }
  image.style.cursor = "grab";

  return figure;
}

export function resolveClickedEditorImage(
  target: EventTarget | null,
): HTMLImageElement | null {
  if (!(target instanceof HTMLElement)) return null;

  if (target instanceof HTMLImageElement) {
    return isSlideEditorImage(target) ? null : target;
  }

  const figure = target.closest("figure");
  if (figure instanceof HTMLElement) {
    if (
      figure.classList.contains("planify-slide-figure") ||
      figure.closest(".planify-slide-deck")
    ) {
      return null;
    }

    const nested = figure.querySelector("img");
    if (nested instanceof HTMLImageElement && !isSlideEditorImage(nested)) {
      return nested;
    }
  }

  return null;
}

export function buildUserFigureHtml(src: string, alt: string): string {
  const safeAlt = alt.replace(/"/g, "&quot;");
  return `<figure class="planify-user-figure" contenteditable="false" draggable="true" data-planify-figure="true" style="margin:16px auto;max-width:100%;text-align:center;display:block;position:relative;">
  <img data-planify-image="true" src="${src}" alt="${safeAlt}" style="width:60%;max-width:100%;height:auto;border-radius:12px;cursor:grab;" />
</figure><p><br></p>`;
}

export function insertHtmlAtCaret(html: string, editor: HTMLElement): void {
  editor.focus();
  restoreEditorSelection();

  const selection = window.getSelection();
  if (!selection) return;

  if (selection.rangeCount === 0) {
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.addRange(range);
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const template = document.createElement("template");
  template.innerHTML = html;
  const fragment = template.content;
  const lastNode = fragment.lastChild;
  range.insertNode(fragment);

  if (lastNode) {
    const after = document.createRange();
    after.setStartAfter(lastNode);
    after.collapse(true);
    selection.removeAllRanges();
    selection.addRange(after);
  }
}

export function caretRangeFromPoint(x: number, y: number): Range | null {
  const doc = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
    caretPositionFromPoint?: (
      x: number,
      y: number,
    ) => { offsetNode: Node; offset: number } | null;
  };

  if (typeof doc.caretRangeFromPoint === "function") {
    return doc.caretRangeFromPoint(x, y);
  }

  if (typeof doc.caretPositionFromPoint === "function") {
    const position = doc.caretPositionFromPoint(x, y);
    if (!position) return null;
    const range = document.createRange();
    range.setStart(position.offsetNode, position.offset);
    range.collapse(true);
    return range;
  }

  return null;
}

export function moveFigureBeforeCaret(
  figure: HTMLElement,
  range: Range,
  editor: HTMLElement,
): void {
  if (!editor.contains(figure)) return;

  const marker = document.createTextNode("");
  range.insertNode(marker);

  if (figure.parentNode) {
    figure.parentNode.insertBefore(figure, marker);
  } else {
    editor.insertBefore(figure, marker);
  }

  marker.remove();

  const selection = window.getSelection();
  if (selection) {
    const after = document.createRange();
    after.setStartAfter(figure);
    after.collapse(true);
    selection.removeAllRanges();
    selection.addRange(after);
  }
}

export function ensureFigureResizeHandle(figure: HTMLElement): HTMLElement {
  let handle = figure.querySelector(
    ".planify-figure-resize-handle",
  ) as HTMLElement | null;

  if (!handle) {
    handle = document.createElement("span");
    handle.className = "planify-figure-resize-handle";
    handle.setAttribute("contenteditable", "false");
    handle.setAttribute("aria-hidden", "true");
    figure.appendChild(handle);
  }

  return handle;
}

export function removeFigureResizeHandles(editor: HTMLElement): void {
  editor
    .querySelectorAll(".planify-figure-resize-handle")
    .forEach((node) => node.remove());
}

export function markSelectedFigure(
  figure: HTMLElement | null,
  editor: HTMLElement | null,
): void {
  editor
    ?.querySelectorAll(
      "figure.planify-user-figure.selected, figure[data-planify-figure='true'].selected",
    )
    .forEach((node) => node.classList.remove("selected"));

  if (figure && isEditableUserFigureElement(figure)) {
    if (!figure.classList.contains("planify-user-figure")) {
      figure.classList.add("planify-user-figure");
    }
    figure.classList.add("selected");
    ensureFigureResizeHandle(figure);
  }
}

export function readImageWidthPercent(image: HTMLImageElement): number {
  const width = Number.parseInt(image.style.width || "60", 10);
  return Number.isFinite(width) ? width : 60;
}

export function applyFigureWidth(
  image: HTMLImageElement,
  widthPercent: number,
): number {
  const safeWidth = Math.max(10, Math.min(100, Math.round(widthPercent)));
  const figure = image.closest("figure");

  image.style.width = `${safeWidth}%`;
  image.style.maxWidth = "100%";
  image.style.height = "auto";

  if (figure instanceof HTMLElement) {
    figure.style.maxWidth = "100%";
  }

  return safeWidth;
}

export async function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });
}

export function extractImageFilesFromClipboard(
  clipboardData: DataTransfer | null,
): File[] {
  if (!clipboardData) return [];

  const files: File[] = [];
  for (const item of Array.from(clipboardData.items)) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) files.push(file);
    }
  }

  for (const file of Array.from(clipboardData.files)) {
    if (file.type.startsWith("image/") && !files.includes(file)) {
      files.push(file);
    }
  }

  return files;
}

export function extractImageSrcFromClipboardHtml(html: string): string | null {
  const trimmed = html.trim();
  if (!trimmed) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(trimmed, "text/html");
  const img = doc.querySelector("img[src]");
  const src = img?.getAttribute("src")?.trim();
  if (!src) return null;

  if (src.startsWith("data:image/") || src.startsWith("blob:")) {
    return src;
  }

  return null;
}

export function extractPastedFigureHtml(html: string): string | null {
  const trimmed = html.trim();
  if (!trimmed) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(trimmed, "text/html");
  const figure = doc.querySelector(
    "figure.planify-user-figure, figure[data-planify-figure='true']",
  );

  if (figure instanceof HTMLElement) {
    return figure.outerHTML;
  }

  return null;
}

export function writeFigureToClipboardData(
  clipboardData: DataTransfer,
  image: HTMLImageElement,
): void {
  const figure = image.closest("figure.planify-user-figure, figure[data-planify-figure='true']");
  const html = figure instanceof HTMLElement ? figure.outerHTML : buildUserFigureHtml(image.src, image.alt || "Imagem");
  const plain = image.alt?.trim() || "Imagem Planify";

  clipboardData.setData("text/html", html);
  clipboardData.setData("text/plain", plain);
}

export function extractImageFilesFromDataTransfer(
  dataTransfer: DataTransfer | null,
): File[] {
  if (!dataTransfer) return [];
  return Array.from(dataTransfer.files).filter((file) =>
    file.type.startsWith("image/"),
  );
}

export const IMAGE_WIDTH_PRESETS = [40, 60, 80, 100] as const;

export const EDITOR_DOCUMENT_OPEN_EVENT = "planify:editor-document-open";
