export function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

export function buildUserFigureHtml(src: string, caption: string): string {
  const safeCaption = escapeHtmlAttr(caption || "Imagem");

  return `<figure class="planify-user-figure" data-planify-user-figure="true" style="margin:16px auto;max-width:100%;text-align:center;position:relative;"><img data-planify-image="true" src="${src}" alt="${safeCaption}" style="width:60%;max-width:100%;height:auto;border-radius:12px;cursor:grab;" draggable="false" /><figcaption style="font-size:12px;color:#64748b;margin-top:6px;">${safeCaption}</figcaption></figure><p><br></p>`;
}

export function insertUserFigureHtml(html: string): void {
  document.execCommand("insertHTML", false, html);
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler imagem."));
    reader.readAsDataURL(file);
  });
}

export function extractImageFileFromDataTransfer(
  dataTransfer: DataTransfer | null,
): File | null {
  if (!dataTransfer) {
    return null;
  }

  const direct = dataTransfer.files?.[0];
  if (direct?.type.startsWith("image/")) {
    return direct;
  }

  for (const item of Array.from(dataTransfer.items || [])) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) {
        return file;
      }
    }
  }

  return null;
}

export function extractImageFileFromClipboard(
  clipboardData: DataTransfer | null,
): File | null {
  return extractImageFileFromDataTransfer(clipboardData);
}

export function applyImageWidthPercent(
  image: HTMLImageElement,
  widthPercent: number,
): number {
  const safeWidth = Math.max(10, Math.min(100, Math.round(widthPercent)));
  const figure = image.closest("figure") ?? image;

  image.style.width = `${safeWidth}%`;
  image.style.maxWidth = "100%";
  image.style.height = "auto";

  if (figure instanceof HTMLElement) {
    figure.style.maxWidth = "100%";
  }

  return safeWidth;
}

function rangeFromPointInEditor(
  doc: Document,
  clientX: number,
  clientY: number,
  editor: HTMLElement,
): Range | null {
  if (doc.caretRangeFromPoint) {
    const range = doc.caretRangeFromPoint(clientX, clientY);
    if (range && editor.contains(range.startContainer)) {
      return range;
    }
  }

  if ("caretPositionFromPoint" in doc) {
    const position = (
      doc as Document & {
        caretPositionFromPoint: (
          x: number,
          y: number,
        ) => { offsetNode: Node; offset: number } | null;
      }
    ).caretPositionFromPoint(clientX, clientY);

    if (position && editor.contains(position.offsetNode)) {
      const range = doc.createRange();
      range.setStart(position.offsetNode, position.offset);
      range.collapse(true);
      return range;
    }
  }

  for (const element of doc.elementsFromPoint(clientX, clientY)) {
    if (!(element instanceof HTMLElement)) {
      continue;
    }

    if (element.dataset.planifyImageOverlay === "true") {
      continue;
    }

    if (!editor.contains(element)) {
      continue;
    }

    if (doc.caretRangeFromPoint) {
      const range = doc.caretRangeFromPoint(clientX, clientY);
      if (range && editor.contains(range.startContainer)) {
        return range;
      }
    }
  }

  return null;
}

export function moveFigureToPoint(
  figure: HTMLElement,
  clientX: number,
  clientY: number,
  editor: HTMLElement,
): boolean {
  const doc = editor.ownerDocument;
  const range = rangeFromPointInEditor(doc, clientX, clientY, editor);

  if (!range) {
    return false;
  }

  if (figure.contains(range.startContainer)) {
    return false;
  }

  const placeholder = doc.createTextNode("");
  range.insertNode(placeholder);
  figure.remove();
  placeholder.parentNode?.insertBefore(figure, placeholder);
  placeholder.remove();

  return true;
}

export function isEditableUserImage(image: HTMLImageElement): boolean {
  if (image.dataset.planifyImage !== "true") {
    return false;
  }

  if (image.classList.contains("planify-slide-image")) {
    return false;
  }

  const figure = image.closest("figure");
  if (figure?.classList.contains("planify-slide-figure")) {
    return false;
  }

  return true;
}
