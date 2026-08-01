import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

const BRAND = {
  purple: "#7C3AED",
  blue: "#2563EB",
  cyan: "#06B6D4",
  ink: "#0F172A",
  body: "#334155",
  muted: "#64748B",
  light: "#F8FAFC",
  border: "#E2E8F0",
} as const;

const MARGIN = 56;

type PdfDoc = InstanceType<typeof PDFDocument>;

function getLogoPath(): string {
  return path.join(process.cwd(), "public", "brand", "planify-owl-graduate.png");
}

function contentWidth(doc: PdfDoc): number {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

function drawBrandAccentBar(doc: PdfDoc, y: number, height = 4) {
  const x = doc.page.margins.left;
  const segment = contentWidth(doc) / 3;
  doc.rect(x, y, segment, height).fill(BRAND.purple);
  doc.rect(x + segment, y, segment, height).fill(BRAND.blue);
  doc.rect(x + segment * 2, y, segment, height).fill(BRAND.cyan);
}

function drawPageFooter(doc: PdfDoc) {
  const footerY = doc.page.height - doc.page.margins.bottom + 12;
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(BRAND.muted)
    .text("Planify · Proposta Comercial B2B", MARGIN, footerY, {
      width: contentWidth(doc),
      align: "center",
      lineBreak: false,
    });
}

function writeHeading(
  doc: PdfDoc,
  text: string,
  options: { size?: number; color?: string; gapAfter?: number } = {},
) {
  const size = options.size ?? 20;
  const color = options.color ?? BRAND.purple;
  const gapAfter = options.gapAfter ?? 14;

  doc
    .font("Helvetica-Bold")
    .fontSize(size)
    .fillColor(color)
    .text(text, doc.page.margins.left, doc.y, {
      width: contentWidth(doc),
      align: "left",
    });

  doc.moveDown(0.2);
  const lineY = doc.y;
  doc
    .moveTo(doc.page.margins.left, lineY)
    .lineTo(doc.page.margins.left + 72, lineY)
    .strokeColor(BRAND.cyan)
    .lineWidth(2)
    .stroke();
  doc.y = lineY + gapAfter;
}

function writeParagraph(
  doc: PdfDoc,
  text: string,
  options: {
    fontSize?: number;
    color?: string;
    bold?: boolean;
    align?: "left" | "justify" | "center";
    gapAfter?: number;
  } = {},
) {
  const fontSize = options.fontSize ?? 11;
  const color = options.color ?? BRAND.body;
  const font = options.bold ? "Helvetica-Bold" : "Helvetica";
  const align = options.align ?? "justify";
  const gapAfter = options.gapAfter ?? 10;

  doc.font(font).fontSize(fontSize).fillColor(color);
  doc.text(text, doc.page.margins.left, doc.y, {
    width: contentWidth(doc),
    align,
    lineGap: 5,
  });
  doc.moveDown(gapAfter / fontSize);
}

function renderCoverPage(doc: PdfDoc, logoPath: string) {
  drawBrandAccentBar(doc, MARGIN - 20, 5);

  const logoWidth = 110;
  const logoX = (doc.page.width - logoWidth) / 2;
  doc.image(logoPath, logoX, MARGIN + 24, { width: logoWidth });

  doc.y = MARGIN + 24 + logoWidth + 36;

  doc
    .font("Helvetica-Bold")
    .fontSize(26)
    .fillColor(BRAND.ink)
    .text(
      "Relatório de Eficiência Pedagógica e Conformidade BNCC 2026",
      doc.page.margins.left,
      doc.y,
      { width: contentWidth(doc), align: "center", lineGap: 6 },
    );

  doc.moveDown(1.2);

  doc
    .font("Helvetica")
    .fontSize(14)
    .fillColor(BRAND.blue)
    .text(
      "Como otimizar em até 80% o tempo burocrático do seu corpo docente e garantir auditoria curricular em tempo real.",
      doc.page.margins.left,
      doc.y,
      { width: contentWidth(doc), align: "center", lineGap: 5 },
    );

  doc.moveDown(2);

  const boxY = doc.y + 20;
  const boxHeight = 52;
  doc
    .roundedRect(doc.page.margins.left + 40, boxY, contentWidth(doc) - 80, boxHeight, 8)
    .fillAndStroke(BRAND.light, BRAND.border);

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(BRAND.purple)
    .text(
      "Destinado a: Diretores, Mantenedores e Coordenadores Pedagógicos.",
      doc.page.margins.left + 56,
      boxY + 18,
      { width: contentWidth(doc) - 112, align: "center" },
    );

  const decorY = doc.page.height - MARGIN - 80;
  drawBrandAccentBar(doc, decorY, 3);
}

function renderBureaucracyPage(doc: PdfDoc) {
  writeHeading(doc, "O Custo Invisível da Burocracia Escolar", { size: 22 });

  writeParagraph(doc, "Prezado(a) Diretor(a) e Equipe de Gestão,", {
    bold: true,
    align: "left",
    gapAfter: 8,
  });

  const paragraphs = [
    "Um dos maiores desafios das instituições de ensino privadas hoje não é a captação de alunos, mas sim a retenção de talentos pedagógicos e o atendimento rigoroso às exigências legais da BNCC.",
    "Atualmente, seus melhores professores gastam, em média, 15 a 20 horas semanais fora da sala de aula apenas preenchendo relatórios, digitando provas do zero e tentando decifrar os códigos de competência da BNCC.",
    "Esse é o Custo Invisível da sua escola: professores cansados, focados em papéis em vez de alunos, e uma coordenação pedagógica sobrecarregada, revisando manualmente se o plano de ensino anual está de fato sendo cumprido para evitar sanções administrativas.",
    "O Planify Escolas nasceu para eliminar esse gargalo de forma definitiva.",
  ];

  for (const paragraph of paragraphs) {
    writeParagraph(doc, paragraph);
  }

  drawPageFooter(doc);
}

function renderFeatureBlock(
  doc: PdfDoc,
  title: string,
  body: string,
  accentColor: string,
) {
  const blockX = doc.page.margins.left;
  const blockWidth = contentWidth(doc);
  const padding = 14;
  const textWidth = blockWidth - padding * 2 - 8;
  const startY = doc.y;

  doc.font("Helvetica-Bold").fontSize(11);
  const titleHeight = doc.heightOfString(title, { width: textWidth });

  doc.font("Helvetica").fontSize(11);
  const bodyHeight = doc.heightOfString(body, {
    width: textWidth,
    lineGap: 5,
  });

  const blockHeight = padding * 2 + titleHeight + 6 + bodyHeight;

  doc
    .roundedRect(blockX, startY, blockWidth, blockHeight, 6)
    .fillAndStroke(BRAND.light, BRAND.border);

  doc.rect(blockX, startY, 4, blockHeight).fill(accentColor);

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(accentColor)
    .text(title, blockX + padding + 4, startY + padding, { width: textWidth });

  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(BRAND.body)
    .text(body, blockX + padding + 4, startY + padding + titleHeight + 6, {
      width: textWidth,
      align: "justify",
      lineGap: 5,
    });

  doc.y = startY + blockHeight + 14;
}

function renderEcosystemPage(doc: PdfDoc) {
  writeHeading(doc, "A Solução Inteligente: Ecossistema Integrado Planify", {
    size: 20,
    gapAfter: 18,
  });

  renderFeatureBlock(
    doc,
    "Para o Professor (O Ganho de Tempo):",
    "Ferramentas de Inteligência Artificial de alta precisão que geram planos de aula, listas de exercícios, slides de alta qualidade e dinâmicas de metodologias ativas alinhadas à BNCC em segundos. O professor recupera seu final de semana e foca no que importa: ensinar.",
    BRAND.purple,
  );

  renderFeatureBlock(
    doc,
    "Para a Coordenação (O Portal da Escola):",
    "Um painel exclusivo de monitoramento. Chega de planilhas de Excel ou cobranças de diários de classe. A coordenação visualiza instantaneamente os materiais gerados por cada professor e o histórico de uso da equipe.",
    BRAND.blue,
  );

  renderFeatureBlock(
    doc,
    "Para a Escola (Auditoria BNCC Real):",
    "Um gráfico dinâmico que calcula automaticamente o percentual de cobertura do currículo obrigatório nacional por turma com base no uso diário do sistema. Segurança jurídica absoluta para a sua instituição perante o MEC.",
    BRAND.cyan,
  );

  drawPageFooter(doc);
}

function renderPilotPage(doc: PdfDoc) {
  writeHeading(doc, "Proposta de Parceria: Programa Escola Piloto Sem Risco", {
    size: 20,
    gapAfter: 12,
  });

  writeParagraph(
    doc,
    "Sabemos que a gestão escolar exige decisões seguras. Por isso, não queremos que você compre um sistema às cegas. Estamos selecionando um grupo exclusivo de apenas 3 instituições de ensino na sua região para participarem do nosso Programa de Escola Piloto 2026.",
    { gapAfter: 12 },
  );

  writeParagraph(doc, "Como funciona o Programa Piloto:", {
    bold: true,
    color: BRAND.blue,
    align: "left",
    gapAfter: 8,
  });

  const steps = [
    "Acesso Total: Liberamos o Portal da Escola para a sua coordenação e contas Planify Pro individuais para todos os professores do seu colégio.",
    "Custo Zero: A sua escola utilizará a plataforma sem pagar nenhuma mensalidade ou taxa de adesão pelas próximas 3 semanas.",
    "Treinamento Incluso: Nossa equipe realiza a ativação rápida dos e-mails dos seus professores e fornece um tutorial direto.",
  ];

  steps.forEach((step, index) => {
    const [label, ...rest] = step.split(": ");
    const detail = rest.join(": ");

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(BRAND.purple)
      .text(`${index + 1}. ${label}: `, doc.page.margins.left, doc.y, {
        width: contentWidth(doc),
        continued: true,
        lineGap: 5,
      });

    doc
      .font("Helvetica")
      .fillColor(BRAND.body)
      .text(detail, { lineGap: 5 });

    doc.moveDown(0.6);
  });

  writeParagraph(
    doc,
    "Nossa Meta: Provar na prática, nas primeiras duas semanas, uma economia de tempo real para os seus professores e entregar o seu primeiro relatório de conformidade da BNCC pronto.",
    { bold: true, align: "left", gapAfter: 20 },
  );

  const ctaY = doc.y;
  const ctaHeight = 72;
  doc
    .roundedRect(doc.page.margins.left, ctaY, contentWidth(doc), ctaHeight, 8)
    .fillAndStroke("#EEF2FF", BRAND.purple);

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(BRAND.ink)
    .text(
      "As vagas para o Programa Piloto Gratuito na sua região fecham em breve por conta do limite de servidores da nossa IA. Fale com a equipe do Planify para garantir a vaga da sua escola.",
      doc.page.margins.left + 16,
      ctaY + 16,
      { width: contentWidth(doc) - 32, align: "center", lineGap: 5 },
    );

  drawPageFooter(doc);
}

export async function generateCommercialProposalPdf(): Promise<Buffer> {
  const logoPath = getLogoPath();
  if (!fs.existsSync(logoPath)) {
    throw new Error("Logo do Planify não encontrado para gerar o PDF.");
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      info: {
        Title: "Proposta Comercial B2B do Planify",
        Author: "Planify",
        Subject: "Relatório de Eficiência Pedagógica e Conformidade BNCC 2026",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    renderCoverPage(doc, logoPath);

    doc.addPage();
    renderBureaucracyPage(doc);

    doc.addPage();
    renderEcosystemPage(doc);

    doc.addPage();
    renderPilotPage(doc);

    doc.end();
  });
}
