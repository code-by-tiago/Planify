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
  }, 1500);
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

  return blob;
}
