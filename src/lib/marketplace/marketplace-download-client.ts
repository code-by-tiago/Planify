import { getCurrentAccessToken } from "@/lib/auth/session-client";

function filenameFromContentDisposition(header: string | null): string | null {
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

export async function downloadMarketplaceMaterial(params: {
  id: string;
  fallbackFileName?: string;
}): Promise<void> {
  const token = await getCurrentAccessToken();
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(`/api/marketplace/materiais/${params.id}/download`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      data?.error?.message || "Não foi possível baixar o material.",
    );
  }

  const blob = await response.blob();
  const filename =
    filenameFromContentDisposition(response.headers.get("Content-Disposition")) ||
    params.fallbackFileName ||
    "material-planify.html";

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
