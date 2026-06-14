"use client";

import { ComunidadeDocenteMaterialCard } from "@/components/community/docente/ComunidadeDocenteMaterialCard";
import type { DocenteMaterial } from "@/lib/community/docente-types";

type ComunidadeDocenteMaterialsProps = {
  materials: DocenteMaterial[];
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onComment?: (id: string) => void;
  onDownload?: (id: string) => void;
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

      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 scrollbar-thin">
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
              onLike={onLike}
              onSave={onSave}
              onComment={onComment}
              onDownload={onDownload}
              downloading={downloadingMaterialId === material.id}
            />
          ))
        )}
      </div>
    </section>
  );
}
