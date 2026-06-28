"use client";

import { preventToolbarFocusLoss } from "@/lib/editor/editor-selection-preserve";

type EditorImageToolbarProps = {
  embedded?: boolean;
  selectedImageName: string;
  selectedImageWidth: number;
  isUserImage: boolean;
  onApplyWidth: (width: number) => void;
  onAlign: (position: "left" | "center" | "right") => void;
  onFloat: (position: "left" | "right") => void;
  onClearFloat: () => void;
  onRemove: () => void;
};

export function EditorImageToolbar({
  embedded = false,
  selectedImageName,
  selectedImageWidth,
  isUserImage,
  onApplyWidth,
  onAlign,
  onFloat,
  onClearFloat,
  onRemove,
}: EditorImageToolbarProps) {
  if (!selectedImageName) {
    return null;
  }

  const btnClass = embedded
    ? "h-7 rounded-md border border-cyan-200 bg-white px-2 text-[10px] font-black text-blue-700"
    : "h-9 rounded-xl border border-cyan-200 bg-white px-3 text-xs font-black text-blue-700 transition";

  return (
    <div
      className={`shrink-0 rounded-lg border border-cyan-200 bg-cyan-50/90 ${
        embedded ? "px-2 py-1.5" : "px-3 py-2"
      }`}
      onMouseDown={preventToolbarFocusLoss}
    >
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-800">
          Imagem
        </span>
        <span className="max-w-40 truncate rounded-lg border border-cyan-100 bg-white px-2 py-1 text-[10px] font-bold text-blue-700 sm:max-w-56 sm:text-xs">
          {selectedImageName}
        </span>

        {[25, 40, 50, 60, 75, 100].map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => onApplyWidth(size)}
            className={btnClass}
          >
            {size}%
          </button>
        ))}

        <label
          className={`flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-white px-2 font-black text-blue-700 ${embedded ? "h-7 text-[10px]" : "h-9 text-xs"}`}
        >
          Largura
          <input
            type="number"
            min={10}
            max={100}
            value={selectedImageWidth}
            onChange={(event) => onApplyWidth(Number(event.target.value))}
            className="h-6 w-14 rounded-md border border-slate-200 bg-white px-1.5 text-xs text-slate-950 outline-none"
          />
          %
        </label>

        <button type="button" onClick={() => onAlign("left")} className={btnClass}>
          Esq.
        </button>
        <button type="button" onClick={() => onAlign("center")} className={btnClass}>
          Centro
        </button>
        <button type="button" onClick={() => onAlign("right")} className={btnClass}>
          Dir.
        </button>

        {isUserImage ? (
          <>
            <button type="button" onClick={() => onFloat("left")} className={btnClass}>
              Texto à dir.
            </button>
            <button type="button" onClick={() => onFloat("right")} className={btnClass}>
              Texto à esq.
            </button>
            <button type="button" onClick={onClearFloat} className={btnClass}>
              Normal
            </button>
          </>
        ) : null}

        <button
          type="button"
          onClick={onRemove}
          className={`${btnClass} border-rose-200 bg-rose-50 text-rose-700`}
        >
          Remover
        </button>

        {isUserImage ? (
          <span className="text-[10px] font-semibold text-cyan-700">
            Arraste a imagem ou use os cantos para redimensionar
          </span>
        ) : null}
      </div>
    </div>
  );
}
