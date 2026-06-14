"use client";

import { useCallback, useEffect, useState } from "react";

export function usePersistedSidebarCollapsed(storageKey: string, defaultCollapsed = false) {
  const [collapsed, setCollapsedState] = useState(defaultCollapsed);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw !== null) setCollapsedState(raw === "true");
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [storageKey]);

  const setCollapsed = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setCollapsedState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        try {
          window.localStorage.setItem(storageKey, String(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [storageKey],
  );

  const toggle = useCallback(() => setCollapsed((current) => !current), [setCollapsed]);

  return { collapsed, setCollapsed, toggle, hydrated };
}
