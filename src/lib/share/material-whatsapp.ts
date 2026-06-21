type MaterialWhatsAppShareInput = {
  title: string;
  tipoLabel?: string;
  componente?: string;
  anoSerie?: string;
  turma?: string;
};

export function buildMaterialWhatsAppShareMessage(
  input: MaterialWhatsAppShareInput,
): string {
  const lines = [
    `📚 *${input.title.trim() || "Material didático"}*`,
    input.tipoLabel ? `Tipo: ${input.tipoLabel}` : "",
    input.componente || input.anoSerie
      ? [input.componente, input.anoSerie].filter(Boolean).join(" · ")
      : "",
    input.turma ? `Turma: ${input.turma}` : "",
    "",
    "Material preparado no Planify — compartilhe com sua turma quando quiser.",
  ].filter(Boolean);

  return lines.join("\n");
}

export function openMaterialWhatsAppShare(message: string): void {
  if (typeof window === "undefined") return;
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export async function copyMaterialShareText(message: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(message);
    return true;
  } catch {
    return false;
  }
}
