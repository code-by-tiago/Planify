"use client";

import { ComunidadeDocenteMaterialCard } from "@/components/community/docente/ComunidadeDocenteMaterialCard";
import type { DocenteMaterial } from "@/lib/community/docente-types";

type ComunidadeDocenteMaterialsProps = {
  materials: DocenteMaterial[];
  onOpen?: (id: string) => void;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onDownload?: (id: string) => void;
  onHideMaterial?: (id: string) => void;
  onUnhideMaterial?: (id: string) => void;
  showHidden?: boolean;
  embedded?: boolean;
  downloadingMaterialId?: string | null;
  onShowAll?: () => void;
  onCreateMaterial?: () => void;
  title?: string;
};

export function ComunidadeDocenteMaterials({
  materials,
  onOpen,
  onLike,
  onSave,
  onDownload,
  onHideMaterial,
  onUnhideMaterial,
  showHidden = false,
  embedded = false,
  downloadingMaterialId,
  onShowAll,
  onCreateMaterial,
  title = "Materiais da Comunidade",
}: ComunidadeDocenteMaterialsProps) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold tracking-tight text-[#0F172A] sm:text-xl">
          {title}
        </h2>
        {onShowAll ? (
          <button
            type="button"
            onClick={onShowAll}
            className="text-sm font-bold text-cyan-600 hover:text-cyan-700"
          >
            Ver todos
          </button>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {materials.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center">
            <p className="text-sm text-slate-500">Nenhum material encontrado com esses filtros.</p>
            {onCreateMaterial ? (
              <button
                type="button"
                onClick={onCreateMaterial}
                className="mt-4 min-h-11 rounded-2xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-cyan-600"
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
              onOpen={onOpen}
              onLike={onLike}
              onSave={onSave}
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
