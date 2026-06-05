"use client";

import { useEffect, useState, type RefObject } from "react";

const DEFAULT_THRESHOLD = 40;

function isScrollable(el: HTMLElement) {
  const style = getComputedStyle(el);
  const oy = style.overflowY;
  return (
    (oy === "auto" || oy === "scroll" || oy === "overlay") &&
    el.scrollHeight > el.clientHeight + 2
  );
}

function scrollDepth(root: HTMLElement) {
  let max = root.scrollTop;
  root.querySelectorAll<HTMLElement>("[data-planify-scroll]").forEach((el) => {
    if (isScrollable(el)) max = Math.max(max, el.scrollTop);
  });
  if (isScrollable(root)) max = Math.max(max, root.scrollTop);
  return max;
}

/** Colapsa quando o contentor ou descendentes roláveis (incl. data-planify-scroll) passam o limiar */
export function useScrollCollapse(
  scrollRef: RefObject<HTMLElement | null>,
  threshold = DEFAULT_THRESHOLD,
) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    function onScroll(event: Event) {
      const container = scrollRef.current;
      const target = event.target;
      if (
        !container ||
        !(target instanceof HTMLElement) ||
        !container.contains(target)
      ) {
        return;
      }
      setCollapsed(scrollDepth(container) > threshold);
    }

    setCollapsed(scrollDepth(root) > threshold);
    root.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => root.removeEventListener("scroll", onScroll, { capture: true });
  }, [scrollRef, threshold]);

  return collapsed;
}
