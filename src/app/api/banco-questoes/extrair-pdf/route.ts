import path from "node:path";
import os from "node:os";
import { readFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { upsertUserQuestion } from "@/server/banco-questoes/question-bank-db-service";
import { extractEntranceExamPdf } from "@/server/banco-questoes/entrance-exam-pdf-extractor";
import { getSupabaseAdminClient } from "@/server/supabase/admin-client";
import { logOperationalEvent } from "@/server/telemetry/operational-telemetry";
import type {
  EntranceExamExtractionConfig,
  EntranceExamExtractionReport,
  EntranceExamExtractedQuestion,
} from "@/types/entrance-exam-extractor";
import type { QuestionBankItem } from "@/types/question-bank";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const LOCAL_ASSET_PUBLIC_PATH = "/question-extract-assets";
const DEFAULT_STORAGE_BUCKET = "question-extract-assets";

type ExtractionResponse = {
  ok: boolean;
  questions: EntranceExamExtractedQuestion[];
  items: QuestionBankItem[];
  reports: EntranceExamExtractionReport[];
  imported: number;
  duplicates: number;
  message?: string;
};

function parseConfig(value: FormDataEntryValue | null): EntranceExamExtractionConfig {
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    const parsed = JSON.parse(value) as EntranceExamExtractionConfig;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function getFiles(formData: FormData): File[] {
  const all = [
    ...formData.getAll("pdf"),
    ...formData.getAll("pdfs"),
    ...formData.getAll("files"),
  ];

  const byName = new Map<string, File>();
  for (const entry of all) {
    if (!(entry instanceof File)) continue;
    const name = entry.name || "prova.pdf";
    if (!name.toLowerCase().endsWith(".pdf")) continue;
    byName.set(`${name}:${entry.size}`, entry);
  }
  return Array.from(byName.values());
}

function shouldUseStorage(): boolean {
  return Boolean(process.env.QUESTION_EXTRACT_STORAGE_BUCKET || process.env.VERCEL);
}

function getStorageBucket(): string {
  return process.env.QUESTION_EXTRACT_STORAGE_BUCKET || DEFAULT_STORAGE_BUCKET;
}

async function uploadExtractionAssetsToStorage(input: {
  userId: string;
  assetBaseDir: string;
  assetPublicPath: string;
  questions: EntranceExamExtractedQuestion[];
  items: QuestionBankItem[];
}): Promise<void> {
  const bucketName = getStorageBucket();
  const supabase = getSupabaseAdminClient();
  const bucket = supabase.storage.from(bucketName);
  const uploaded = new Map<string, string>();

  async function resolvePublicUrl(url: string): Promise<string> {
    if (!url.startsWith(input.assetPublicPath)) return url;
    const relativePath = url
      .slice(input.assetPublicPath.length)
      .replace(/^[/\\]+/, "")
      .replace(/\\/g, "/");
    if (!relativePath) return url;
    const cached = uploaded.get(relativePath);
    if (cached) return cached;

    const localPath = path.join(input.assetBaseDir, relativePath);
    const buffer = await readFile(localPath);
    const storagePath = `${input.userId}/${relativePath}`;
    const upload = await bucket.upload(storagePath, buffer, {
      contentType: "image/png",
      upsert: true,
    });
    if (upload.error) throw new Error(upload.error.message);

    const { data } = bucket.getPublicUrl(storagePath);
    const publicUrl = data.publicUrl;
    uploaded.set(relativePath, publicUrl);
    return publicUrl;
  }

  for (const question of input.questions) {
    for (const image of question.images) {
      image.url = await resolvePublicUrl(image.url);
    }
    question.image = question.images[0]?.url ?? question.image;
  }

  for (const item of input.items) {
    if (!item.imageUrls?.length) continue;
    item.imageUrls = await Promise.all(
      item.imageUrls.map((url) => resolvePublicUrl(url)),
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const userId = auth.access.user?.id;
  if (!userId) {
    return NextResponse.json(
      { ok: false, message: "Usuario nao autenticado." },
      { status: 401 },
    );
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      { ok: false, message: "Envie o PDF em multipart/form-data." },
      { status: 400 },
    );
  }

  const files = getFiles(formData);
  if (!files.length) {
    return NextResponse.json(
      { ok: false, message: "Envie ao menos um arquivo PDF." },
      { status: 400 },
    );
  }

  const importToBank = String(formData.get("import") || "") === "true";
  const baseConfig = parseConfig(formData.get("config"));
  const useStorage = shouldUseStorage();
  const assetBaseDir = useStorage
    ? path.join(os.tmpdir(), "planify-question-extract-assets")
    : path.join(process.cwd(), "public", "question-extract-assets");
  const assetPublicPath = LOCAL_ASSET_PUBLIC_PATH;

  const questions: EntranceExamExtractedQuestion[] = [];
  const items: QuestionBankItem[] = [];
  const reports: EntranceExamExtractionReport[] = [];
  let imported = 0;
  let duplicates = 0;

  try {
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        reports.push({
          pdfName: file.name,
          pageCount: 0,
          textLineCount: 0,
          questionsFound: 0,
          multipleChoiceCount: 0,
          openQuestionCount: 0,
          imageCount: 0,
          associatedImageCount: 0,
          warnings: ["Arquivo maior que 25 MB. Envie um PDF menor ou divida a prova."],
        });
        continue;
      }

      const pdfBuffer = Buffer.from(await file.arrayBuffer());
      const config = {
        ...baseConfig,
        tema: baseConfig.tema || file.name.replace(/\.pdf$/i, ""),
      };
      const result = await extractEntranceExamPdf({
        pdfBuffer,
        fileName: file.name,
        config,
        assetBaseDir,
        assetPublicPath,
      });

      if (useStorage && result.questions.some((question) => question.images.length > 0)) {
        await uploadExtractionAssetsToStorage({
          userId,
          assetBaseDir,
          assetPublicPath,
          questions: result.questions,
          items: result.items,
        });
      }

      questions.push(...result.questions);
      reports.push(result.report);

      if (!importToBank) {
        items.push(...result.items);
        continue;
      }

      for (const item of result.items) {
        const { item: saved, duplicate } = await upsertUserQuestion(userId, item);
        items.push({
          ...saved,
          imageUrls: item.imageUrls,
        });
        if (duplicate) duplicates += 1;
        else imported += 1;
      }
    }

    logOperationalEvent({
      eventType: "question_pdf_extract",
      toolTipo: "banco-pdf-extract",
      ok: true,
      metadata: {
        files: files.map((file) => file.name),
        importToBank,
        questions: questions.length,
        imported,
        duplicates,
      },
    });

    const payload: ExtractionResponse = {
      ok: true,
      questions,
      items,
      reports,
      imported,
      duplicates,
    };
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao extrair questoes do PDF.";

    logOperationalEvent({
      eventType: "question_pdf_extract_error",
      toolTipo: "banco-pdf-extract",
      ok: false,
      errorCode: "pdf_extract_failed",
      metadata: {
        files: files.map((file) => file.name),
        message,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        message,
        questions,
        items,
        reports,
        imported,
        duplicates,
      },
      { status: 500 },
    );
  }
}
