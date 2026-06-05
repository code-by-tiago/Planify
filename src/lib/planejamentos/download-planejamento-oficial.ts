type PlanejamentoPayload = Record<string, unknown>;

function safeFileName(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 90) || "planejamento-planify"
  );
}

export async function downloadPlanejamentoOficialDocx(
  payload: PlanejamentoPayload,
  fallbackFilename = "planejamento-planify",
) {
  const response = await fetch("/api/planejamentos/docx-oficial", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.error?.message ||
        error?.message ||
        "Não foi possível baixar o planejamento DOCX.",
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
