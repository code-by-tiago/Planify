/** Dispara download de blob no navegador (desktop + mobile). */
export function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();

  window.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 60_000);
}

function isAppleTouchDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/** Abre a aba no clique (gesto do usuário) para o iOS não bloquear o PDF depois do fetch. */
export function openPendingDownloadWindow(): Window | null {
  if (typeof window === "undefined" || !isAppleTouchDevice()) {
    return null;
  }

  return window.open("about:blank", "_blank");
}

/**
 * Salva o arquivo completo no celular (share sheet / visualizador nativo)
 * e faz download tradicional no desktop.
 */
export async function saveOrDownloadFile(
  blob: Blob,
  filename: string,
  pendingWindow?: Window | null,
): Promise<void> {
  const type = blob.type || "application/octet-stream";
  const file = new File([blob], filename, { type });

  const isMobile =
    isAppleTouchDevice() ||
    (typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent));

  if (
    isMobile &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file], title: filename });
      pendingWindow?.close();
      return;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        pendingWindow?.close();
        return;
      }
    }
  }

  const url = URL.createObjectURL(blob);

  if (pendingWindow && !pendingWindow.closed) {
    pendingWindow.location.href = url;
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }

  if (isAppleTouchDevice()) {
    window.location.assign(url);
    return;
  }

  URL.revokeObjectURL(url);
  triggerBrowserDownload(blob, filename);
}

export function filenameFromContentDisposition(header: string | null): string | null {
  if (!header) {
    return null;
  }

  const utfMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1]);
    } catch {
      return utfMatch[1];
    }
  }

  const asciiMatch = header.match(/filename="([^"]+)"/i);
  return asciiMatch?.[1] || null;
}

export async function readDownloadBlob(response: Response): Promise<Blob> {
  const contentType = (response.headers.get("Content-Type") || "").toLowerCase();

  if (contentType.includes("application/json") || contentType.includes("text/plain")) {
    const data = await response.json().catch(() => null);
    throw new Error(
      data?.error?.message || data?.message || "Não foi possível gerar o arquivo.",
    );
  }

  const blob = await response.blob();

  if (blob.size < 32) {
    throw new Error("O arquivo gerado está vazio. Tente novamente.");
  }

  if (contentType.includes("pdf")) {
    const header = await blob.slice(0, 4).text();
    if (!header.startsWith("%PDF")) {
      throw new Error("O PDF gerado é inválido. Tente novamente em alguns segundos.");
    }
  }

  if (
    contentType.includes("wordprocessingml") ||
    contentType.includes("msword") ||
    contentType.includes("application/zip") ||
    contentType.includes("application/x-zip")
  ) {
    const header = await blob.slice(0, 2).arrayBuffer();
    const bytes = new Uint8Array(header);
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
      throw new Error("O arquivo gerado é inválido. Tente novamente.");
    }
  }

  return blob;
}
