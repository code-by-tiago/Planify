"use client";

import { ComunidadeDocenteMaterialCard } from "@/components/community/docente/ComunidadeDocenteMaterialCard";
import type { DocenteMaterial } from "@/lib/community/docente-types";

type ComunidadeDocenteMaterialsProps = {
  materials: DocenteMaterial[];
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onComment?: (id: string) => void;
  onDownload?: (id: string) => void;
  onHideMaterial?: (id: string) => void;
  onUnhideMaterial?: (id: string) => void;
  showHidden?: boolean;
  embedded?: boolean;
  downloadingMaterialId?: string | null;
  onShowAll?: () => void;
  onCreateMaterial?: () => void;
};

export function ComunidadeDocenteMaterials({
  materials,
  onLike,
  onSave,
  onComment,
  onDownload,
  onHideMaterial,
  onUnhideMaterial,
  showHidden = false,
  embedded = false,
  downloadingMaterialId,
  onShowAll,
  onCreateMaterial,
}: ComunidadeDocenteMaterialsProps) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold tracking-tight text-[#0F172A] sm:text-xl">
          Materiais mais acessados
        </h2>
        <button
          type="button"
          onClick={onShowAll}
          className="text-sm font-bold text-cyan-600 hover:text-cyan-700"
        >
          Ver todos
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {materials.length === 0 ? (
          <div className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center">
            <p className="text-sm text-slate-500">Nenhum material publicado ainda.</p>
            {onCreateMaterial ? (
              <button
                type="button"
                onClick={onCreateMaterial}
                className="mt-4 rounded-2xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-cyan-600"
              >
                Publicar material
              </button>
            ) : null}
          </div>
        ) : (
          materials.map((material) => (
            <ComunidadeDocenteMaterialCard
              key={material.id}
              material={material}
              embedded={embedded}
              onLike={onLike}
              onSave={onSave}
              onComment={onComment}
              onDownload={onDownload}
              onHide={showHidden ? undefined : onHideMaterial}
              onUnhide={showHidden ? onUnhideMaterial : undefined}
              isHidden={showHidden}
              downloading={downloadingMaterialId === material.id}
            />
          ))
        )}
      </div>
    </section>
  );
}
