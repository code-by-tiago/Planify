import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";

function buildFallbackHtml(item: {
  title: string;
  description: string;
  etapa: string;
  anoSerie?: string;
  componente: string;
  tipoMaterial?: string;
  categoria: string;
  tema?: string;
}) {
  return `
    <article class="planify-doc" style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h1>${item.title}</h1>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="border:1px solid #cbd5e1;padding:8px;"><strong>Etapa</strong></td><td style="border:1px solid #cbd5e1;padding:8px;">${item.etapa || ""}</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:8px;"><strong>Ano/Série</strong></td><td style="border:1px solid #cbd5e1;padding:8px;">${item.anoSerie || "Geral"}</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:8px;"><strong>Componente</strong></td><td style="border:1px solid #cbd5e1;padding:8px;">${item.componente || ""}</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:8px;"><strong>Tipo</strong></td><td style="border:1px solid #cbd5e1;padding:8px;">${item.tipoMaterial || item.categoria || ""}</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:8px;"><strong>Tema</strong></td><td style="border:1px solid #cbd5e1;padding:8px;">${item.tema || ""}</td></tr>
      </table>
      <h2>Descrição pedagógica</h2>
      <p>${item.description || ""}</p>
    </article>
  `;
}

export async function openBibliotecaMaterialInEditor(item: {
  id: string;
  title: string;
  description: string;
  etapa: string;
  anoSerie?: string;
  componente: string;
  tipoMaterial?: string;
  categoria: string;
  tema?: string;
}): Promise<void> {
  let html = buildFallbackHtml(item);
  let title = item.title;

  try {
    const response = await planifyAuthenticatedFetch(
      `/api/biblioteca/materiais/${item.id}/preview`,
      { method: "GET", cache: "no-store" },
    );
    const data = (await response.json()) as {
      success?: boolean;
      html?: string;
      title?: string;
      error?: { message?: string };
    };

    if (response.ok && data.success && data.html) {
      html = data.html;
      title = data.title || item.title;
    }
  } catch {
    /* fallback html */
  }

  localStorage.setItem(
    "planify_editor_document",
    JSON.stringify({
      type: "biblioteca",
      title,
      html,
      content: html,
      bibliotecaId: item.id,
      updatedAt: new Date().toISOString(),
    }),
  );

  localStorage.setItem("planify_editor_content", html);
  window.location.href = "/editor?from=biblioteca";
}
