"use client";

import { useEffect } from "react";

/** Registra o service worker do shell Planify (app autenticado). */
export function PlanifyPwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Silencioso: PWA é melhoria, não bloqueia o app.
    });
  }, []);

  return null;
}
