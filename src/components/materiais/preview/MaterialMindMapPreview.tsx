"use client";

import { useMemo } from "react";
import { PLANIFY_EXPORT_CSS } from "@/lib/editor/editor-print-html";
import { parseSectionsFromHtml } from "@/lib/materiais/material-preview-parse";
import { MaterialDocumentPreview } from "@/components/materiais/MaterialDocumentPreview";

type MaterialMindMapPreviewProps = {
  html: string;
};

export function MaterialMindMapPreview({ html }: MaterialMindMapPreviewProps) {
  const { svgHtml, branches } = useMemo(() => {
    if (typeof DOMParser === "undefined") {
      return { svgHtml: "", branches: [] as { title: string; items: string[] }[] };
    }
    const doc = new DOMParser().parseFromString(html, "text/html");
    const svg = doc.querySelector(".planify-mindmap-radial svg");
    const branchEls = doc.querySelectorAll(".planify-mindmap-branch");
    const parsedBranches = Array.from(branchEls).map((el) => {
      const title = el.querySelector("h3")?.textContent?.trim() || "Ramo";
      const items = Array.from(el.querySelectorAll(".planify-mindmap-chip, span[style*='border-radius:999px']"))
        .map((chip) => chip.textContent?.trim() || "")
        .filter(Boolean);
      return { title, items };
    });
    return {
      svgHtml: svg?.outerHTML || "",
      branches: parsedBranches,
    };
  }, [html]);

  const sections = useMemo(() => parseSectionsFromHtml(html), [html]);

  if (!svgHtml && sections.length <= 1) {
    return <MaterialDocumentPreview html={html} tipoMaterial="mapa-mental" />;
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
        Mapa mental — visão radial
      </p>

      {svgHtml ? (
        <div className="-mx-1 overflow-x-auto rounded-2xl border border-slate-300 bg-white px-2 py-3">
          <style dangerouslySetInnerHTML={{ __html: PLANIFY_EXPORT_CSS }} />
          <div
            className="mx-auto min-w-[min(100%,320px)] max-w-full"
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
        </div>
      ) : null}

      {branches.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {branches.map((branch) => (
            <div
              key={branch.title}
              className="rounded-xl border border-slate-200 bg-white p-3"
            >
              <p className="text-sm font-extrabold text-slate-950">{branch.title}</p>
              {branch.items.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {branch.items.map((item) => (
                    <li
                      key={`${branch.title}-${item}`}
                      className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-900"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
