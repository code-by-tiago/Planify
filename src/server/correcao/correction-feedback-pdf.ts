import PDFDocument from "pdfkit";
import type { CorrectionAiOutput } from "@/types/correction";

export type CorrectionPdfMeta = {
  aluno?: string;
  componente?: string;
  data?: string;
};

export type CorrectionPdfEntry = {
  result: CorrectionAiOutput;
  meta?: CorrectionPdfMeta;
};

function renderEntry(
  doc: InstanceType<typeof PDFDocument>,
  entry: CorrectionPdfEntry,
  index: number,
) {
  const { result, meta } = entry;

  if (index > 0) {
    doc.addPage();
  }

  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .text(meta?.aluno ? `Devolutiva — ${meta.aluno}` : "Devolutiva de correção");

  if (meta?.componente || meta?.data) {
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#555555")
      .text(
        [meta.componente, meta.data].filter(Boolean).join(" · "),
        { lineGap: 4 },
      );
    doc.fillColor("#000000");
  }

  doc.moveDown(0.5);
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text(`Nota: ${result.nota}/${result.notaMaxima} (${result.percentual}%)`);

  doc.moveDown(0.5);
  doc.fontSize(11).font("Helvetica-Bold").text("Feedback geral");
  doc.font("Helvetica").text(result.feedbackGeral, { lineGap: 3 });

  if (result.criterios.length) {
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").text("Critérios");
    for (const criterio of result.criterios) {
      doc
        .font("Helvetica")
        .text(
          `• ${criterio.criterio}: ${criterio.pontos}/${criterio.pontosMaximos} — ${criterio.comentario}`,
          { lineGap: 2 },
        );
    }
  }

  if (result.pontosFortes.length) {
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").text("Pontos fortes");
    for (const ponto of result.pontosFortes) {
      doc.font("Helvetica").text(`• ${ponto}`);
    }
  }

  if (result.pontosMelhoria.length) {
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").text("Pontos de melhoria");
    for (const ponto of result.pontosMelhoria) {
      doc.font("Helvetica").text(`• ${ponto}`);
    }
  }

  if (result.sugestaoProfessor?.trim()) {
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").text("Sugestão para o professor");
    doc.font("Helvetica").text(result.sugestaoProfessor, { lineGap: 3 });
  }
}

export async function buildCorrectionFeedbackPdf(
  entries: CorrectionPdfEntry[],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    entries.slice(0, 5).forEach((entry, index) => {
      renderEntry(doc, entry, index);
    });

    doc.end();
  });
}
