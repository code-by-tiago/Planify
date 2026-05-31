type DocxKind = "material" | "biblioteca" | "marketplace" | "generic";

function safeFileName(value: string) {
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

export async function downloadDocxDocument(
  kind: DocxKind,
  payload: unknown,
  fallbackFilename = "documento-planify",
) {
  const response = await fetch("/api/documentos/docx", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      kind,
      document: payload,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      error?.error?.message || "Não foi possível baixar o DOCX agora.",
    );
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");

  anchor.href = url;
  anchor.download = `${safeFileName(fallbackFilename)}.docx`;
  anchor.click();

  URL.revokeObjectURL(url);
}
