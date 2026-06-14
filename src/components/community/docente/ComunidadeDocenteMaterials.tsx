"use client";

import { ComunidadeDocenteMaterialCard } from "@/components/community/docente/ComunidadeDocenteMaterialCard";
import type { DocenteMaterial } from "@/lib/community/docente-types";

type ComunidadeDocenteMaterialsProps = {
  materials: DocenteMaterial[];
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onShowAll?: () => void;
};

export function ComunidadeDocenteMaterials({
  materials,
  onLike,
  onSave,
  onShowAll,
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
          <p className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
            Nenhum material publicado ainda. Compartilhe o seu!
          </p>
        ) : (
          materials.map((material) => (
            <ComunidadeDocenteMaterialCard
              key={material.id}
              material={material}
              onLike={onLike}
              onSave={onSave}
            />
          ))
        )}
      </div>
    </section>
  );
}
