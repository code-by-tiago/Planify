"use client";

import { ComunidadeDocenteMaterialCard } from "@/components/community/docente/ComunidadeDocenteMaterialCard";
import type { DocenteMaterial } from "@/lib/community/docente-types";

type ComunidadeDocenteMaterialsProps = {
  materials: DocenteMaterial[];
  onLike: (id: string) => void;
  onSave: (id: string) => void;
};

export function ComunidadeDocenteMaterials({
  materials,
  onLike,
  onSave,
}: ComunidadeDocenteMaterialsProps) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold tracking-tight text-[#0F172A] sm:text-xl">
          Materiais mais acessados
        </h2>
        <button
          type="button"
          className="text-sm font-bold text-cyan-600 hover:text-cyan-700"
        >
          Ver todos
        </button>
      </div>

      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 scrollbar-thin">
        {materials.map((material) => (
          <ComunidadeDocenteMaterialCard
            key={material.id}
            material={material}
            onLike={onLike}
            onSave={onSave}
          />
        ))}
      </div>
    </section>
  );
}
