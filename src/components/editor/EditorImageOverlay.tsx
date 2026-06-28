"use client";

import { useCallback, useEffect, useState } from "react";
import {
  applyImageWidthPercent,
  moveFigureToPoint,
} from "@/lib/editor/contenteditable-image";

type EditorImageOverlayProps = {
  image: HTMLImageElement | null;
  editor: HTMLElement | null;
  container: HTMLElement | null;
  scrollContainer: HTMLElement | null;
  onWidthChange: (width: number, options?: { persist?: boolean }) => void;
  onMoved: () => void;
};

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function getOverlayRect(image: HTMLImageElement, container: HTMLElement): Rect {
  const imageBox = image.getBoundingClientRect();
  const containerBox = container.getBoundingClientRect();

  return {
    top: imageBox.top - containerBox.top,
    left: imageBox.left - containerBox.left,
    width: imageBox.width,
    height: imageBox.height,
  };
}

export function EditorImageOverlay({
  image,
  editor,
  container,
  scrollContainer,
  onWidthChange,
  onMoved,
}: EditorImageOverlayProps) {
  const [rect, setRect] = useState<Rect | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const refreshRect = useCallback(() => {
    if (!image || !container) {
      setRect(null);
      return;
    }

    setRect(getOverlayRect(image, container));
  }, [container, image]);

  useEffect(() => {
    refreshRect();
  }, [refreshRect]);

  useEffect(() => {
    if (!image || !container) {
      return;
    }

    const onScrollOrResize = () => refreshRect();
    scrollContainer?.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      scrollContainer?.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [container, image, refreshRect, scrollContainer]);

  function startResize(event: React.MouseEvent, corner: "nw" | "ne" | "sw" | "se") {
    event.preventDefault();
    event.stopPropagation();

    if (!editor || !image) {
      return;
    }

    const resizeImage = image;
    setIsResizing(true);

    const figure = resizeImage.closest("figure");
    const figureWidth = figure?.getBoundingClientRect().width || editor.getBoundingClientRect().width || 1;
    const startX = event.clientX;
    const startWidthPx = resizeImage.getBoundingClientRect().width;

    function onMouseMove(moveEvent: MouseEvent) {
      const delta =
        corner === "nw" || corner === "sw"
          ? startX - moveEvent.clientX
          : moveEvent.clientX - startX;
      const nextWidthPx = Math.max(40, startWidthPx + delta);
      const applied = applyImageWidthPercent(resizeImage, (nextWidthPx / figureWidth) * 100);
      onWidthChange(applied, { persist: false });
      refreshRect();
    }

    function onMouseUp() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      setIsResizing(false);
      onWidthChange(
        Number.parseInt(String(resizeImage.style.width || "60").replace("%", ""), 10) || 60,
        { persist: true },
      );
      refreshRect();
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  function startDrag(event: React.MouseEvent) {
    if ((event.target as HTMLElement).dataset.handle === "resize") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (!image || !editor) {
      return;
    }

    const dragFigure = image.closest("figure");

    if (!(dragFigure instanceof HTMLElement)) {
      return;
    }

    const dragImage = image;
    const dragEditor = editor;

    const dragFigureEl = dragFigure;

    setIsDragging(true);
    dragImage.style.cursor = "grabbing";
    dragImage.style.opacity = "0.75";

    function onMouseUp(upEvent: MouseEvent) {
      window.removeEventListener("mouseup", onMouseUp);
      setIsDragging(false);
      dragImage.style.cursor = "grab";
      dragImage.style.opacity = "";

      if (
        moveFigureToPoint(
          dragFigureEl,
          upEvent.clientX,
          upEvent.clientY,
          dragEditor,
        )
      ) {
        onMoved();
      }

      refreshRect();
    }

    window.addEventListener("mouseup", onMouseUp);
  }

  if (!image || !rect || !container) {
    return null;
  }

  const handleClass =
    "pointer-events-auto absolute h-3 w-3 rounded-sm border border-white bg-cyan-500 shadow";
  const passive = isDragging || isResizing;

  return (
    <div
      className={`absolute inset-0 z-20 ${passive ? "pointer-events-none" : "pointer-events-none"}`}
      data-planify-image-overlay="true"
      aria-hidden
    >
      <div
        className={`absolute border-2 border-cyan-400 ${passive ? "pointer-events-none" : "pointer-events-auto"}`}
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          cursor: "grab",
        }}
        onMouseDown={startDrag}
      >
        <button
          type="button"
          data-handle="resize"
          aria-label="Redimensionar canto superior esquerdo"
          className={`${handleClass} -left-1.5 -top-1.5 cursor-nwse-resize`}
          onMouseDown={(event) => startResize(event, "nw")}
        />
        <button
          type="button"
          data-handle="resize"
          aria-label="Redimensionar canto superior direito"
          className={`${handleClass} -right-1.5 -top-1.5 cursor-nesw-resize`}
          onMouseDown={(event) => startResize(event, "ne")}
        />
        <button
          type="button"
          data-handle="resize"
          aria-label="Redimensionar canto inferior esquerdo"
          className={`${handleClass} -bottom-1.5 -left-1.5 cursor-nesw-resize`}
          onMouseDown={(event) => startResize(event, "sw")}
        />
        <button
          type="button"
          data-handle="resize"
          aria-label="Redimensionar canto inferior direito"
          className={`${handleClass} -bottom-1.5 -right-1.5 cursor-nwse-resize`}
          onMouseDown={(event) => startResize(event, "se")}
        />
      </div>
    </div>
  );
}
