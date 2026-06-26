"use client";

import {
  useEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";

const PROTECTED_CLASS =
  "select-none [&_*]:select-none [-webkit-touch-callout:none]";

const BLOCKED_KEYS = new Set(["c", "x", "a", "u", "s"]);

type PlanningTrialProtectedZoneProps = {
  enabled?: boolean;
  as?: "div" | "article";
  children?: ReactNode;
} & HTMLAttributes<HTMLElement>;

function usePlanningTrialCopyProtection(
  ref: React.RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    function blockEvent(event: Event) {
      event.preventDefault();
    }

    function blockKeys(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (!BLOCKED_KEYS.has(key)) return;
      event.preventDefault();
    }

    const options: AddEventListenerOptions = { capture: true };
    el.addEventListener("copy", blockEvent, options);
    el.addEventListener("cut", blockEvent, options);
    el.addEventListener("contextmenu", blockEvent, options);
    el.addEventListener("selectstart", blockEvent, options);
    el.addEventListener("dragstart", blockEvent, options);
    el.addEventListener("keydown", blockKeys, options);

    return () => {
      el.removeEventListener("copy", blockEvent, options);
      el.removeEventListener("cut", blockEvent, options);
      el.removeEventListener("contextmenu", blockEvent, options);
      el.removeEventListener("selectstart", blockEvent, options);
      el.removeEventListener("dragstart", blockEvent, options);
      el.removeEventListener("keydown", blockKeys, options);
    };
  }, [enabled, ref]);
}

export function PlanningTrialProtectedZone({
  enabled = true,
  as: Tag = "div",
  className = "",
  children,
  ...rest
}: PlanningTrialProtectedZoneProps) {
  const ref = useRef<HTMLElement>(null);
  usePlanningTrialCopyProtection(ref, enabled);

  const mergedClass = enabled
    ? `${PROTECTED_CLASS} ${className}`.trim()
    : className;

  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} className={mergedClass} {...rest}>
      {children}
    </Tag>
  );
}
