const PLANNING_EXPORT_SCRIPT_ID = "planify-planning-export-data";

/** Injeta matriz oficial no HTML publicado (Comunidade) para export Google Docs. */
export function embedPlanningPayloadInHtml(
  html: string,
  payload: Record<string, unknown>,
): string {
  const serialized = JSON.stringify(payload).replace(/</g, "\\u003c");
  const tag = `<script type="application/json" id="${PLANNING_EXPORT_SCRIPT_ID}">${serialized}</script>`;

  if (html.includes(`id="${PLANNING_EXPORT_SCRIPT_ID}"`)) {
    return html.replace(
      new RegExp(
        `<script[^>]*id="${PLANNING_EXPORT_SCRIPT_ID}"[^>]*>[\\s\\S]*?<\\/script>`,
        "i",
      ),
      tag,
    );
  }

  return `${html}\n${tag}`;
}

export function extractPlanningPayloadFromHtml(
  html: string,
): Record<string, unknown> | null {
  const match = html.match(
    new RegExp(
      `<script[^>]*id="${PLANNING_EXPORT_SCRIPT_ID}"[^>]*>([\\s\\S]*?)<\\/script>`,
      "i",
    ),
  );

  if (!match?.[1]) return null;

  try {
    const parsed = JSON.parse(match[1].trim()) as Record<string, unknown>;
    const matriz = parsed.matrizPlanejamento;
    const conteudos =
      matriz && typeof matriz === "object"
        ? (matriz as { conteudos?: unknown }).conteudos
        : null;

    if (!Array.isArray(conteudos) || conteudos.length === 0) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
