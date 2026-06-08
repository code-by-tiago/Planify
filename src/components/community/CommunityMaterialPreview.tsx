"use client";

import { PLANIFY_EXPORT_CSS, PLANIFY_SLIDE_EXPORT_CSS } from "@/lib/editor/editor-print-html";
import type { MarketplacePreviewKind } from "@/server/marketplace/marketplace-preview";

type CommunityMaterialPreviewProps = {
  kind: MarketplacePreviewKind;
  title: string;
  signedUrl?: string | null;
  htmlContent?: string | null;
  isSlidePreview?: boolean;
  fileName?: string;
};

const htmlPreviewClassName =
  "planify-community-material-html text-sm leading-7 text-slate-800 [&_.planify-export-document]:mx-auto [&_.planify-flashcards]:flex [&_.planify-flashcards]:flex-wrap [&_.planify-flashcards]:gap-4 [&_.planify-slide-deck]:space-y-6 [&_h1]:text-2xl [&_h1]:font-black [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-black [&_h3]:mt-3 [&_h3]:font-black [&_img]:max-w-full [&_li]:ml-5 [&_ol]:list-decimal [&_p]:my-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-200 [&_td]:p-2 [&_th]:border [&_th]:border-slate-200 [&_th]:p-2 [&_ul]:list-disc";

export function CommunityMaterialPreview({
  kind,
  title,
  signedUrl,
  htmlContent,
  isSlidePreview,
  fileName,
}: CommunityMaterialPreviewProps) {
  if (kind === "html" && htmlContent) {
    return (
      <div className="overflow-hidden rounded-2xl border border-cyan-400/15 bg-white shadow-sm">
        <style>{isSlidePreview ? PLANIFY_SLIDE_EXPORT_CSS : PLANIFY_EXPORT_CSS}</style>
        <div className="max-h-[min(78vh,920px)] overflow-auto bg-white p-4 sm:p-6">
          <div
            className={`${htmlPreviewClassName} ${isSlidePreview ? "planify-community-material-slides" : ""}`}
            dangerouslySetInnerHTML={{
              __html: isSlidePreview
                ? `<div class="planify-export-document">${htmlContent}</div>`
                : `<main class="planify-export-document">${htmlContent}</main>`,
            }}
          />
        </div>
      </div>
    );
  }

  if (kind === "pdf" && signedUrl) {
    return (
      <div className="overflow-hidden rounded-2xl border border-cyan-400/15 bg-white shadow-sm">
        <iframe
          title={title}
          src={`${signedUrl}#toolbar=1&navpanes=0`}
          className="h-[min(78vh,920px)] w-full bg-slate-100"
        />
      </div>
    );
  }

  if (kind === "docx") {
    return (
      <DocxFallback title={title} fileName={fileName} />
    );
  }

  return (
    <BinaryFallback title={title} fileName={fileName} kind={kind} />
  );
}

function DocxFallback({ title, fileName }: { title: string; fileName?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-400/25 bg-gradient-to-b from-white to-cyan-50/40 px-6 py-14 text-center">
      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
        DOCX
      </span>
      <h3 className="mt-4 text-lg font-extrabold text-slate-950">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
        Este material foi publicado em Word (.docx). Baixe o arquivo para abrir no seu editor
        preferido.
      </p>
      {fileName ? (
        <p className="mt-3 text-xs font-semibold text-slate-500">{fileName}</p>
      ) : null}
    </div>
  );
}

function BinaryFallback({
  title,
  fileName,
  kind,
}: {
  title: string;
  fileName?: string;
  kind: MarketplacePreviewKind;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-400/25 bg-gradient-to-b from-white to-slate-50 px-6 py-14 text-center">
      <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
        {kind === "binary" ? "Anexo" : kind.toUpperCase()}
      </span>
      <h3 className="mt-4 text-lg font-extrabold text-slate-950">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
        Pré-visualização indisponível para este formato. Use os botões de download abaixo.
      </p>
      {fileName ? (
        <p className="mt-3 text-xs font-semibold text-slate-500">{fileName}</p>
      ) : null}
    </div>
  );
}
