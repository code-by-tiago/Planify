export type ClassroomPopoverCoords = {
  top: number;
  left: number;
  width: number;
};

export function computeClassroomPopoverCoords(
  button: HTMLButtonElement,
  estimatedHeight: number,
): ClassroomPopoverCoords {
  const rect = button.getBoundingClientRect();
  const width = Math.min(320, window.innerWidth - 16);
  let left = rect.right - width;
  left = Math.max(8, Math.min(left, window.innerWidth - width - 8));

  let top = rect.bottom + 8;
  if (top + estimatedHeight > window.innerHeight - 8) {
    top = Math.max(8, rect.top - estimatedHeight - 8);
  }

  return { top, left, width };
}

export function estimateClassroomPopoverHeight(options: {
  step: "form" | "success";
  needsEducarConnect: boolean;
  canOpenClassroomHandoff: boolean;
}): number {
  if (options.step === "success") return 280;
  if (options.needsEducarConnect) return 320;
  if (options.canOpenClassroomHandoff) return 300;
  return 300;
}
