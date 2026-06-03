"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Em usuários premium autenticados, envia da landing para o Studio (/dashboard).
 */
export default function StudioSessionRedirect() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function redirectIfPremium() {
      try {
        const response = await fetch("/api/access/status", {
          cache: "no-store",
          credentials: "include",
        });
        if (!response.ok || !active) return;

        const data = (await response.json()) as {
          authenticated?: boolean;
          premium?: boolean;
        };

        if (data.authenticated && data.premium) {
          router.replace("/dashboard");
        }
      } catch {
        /* visitante ou erro — permanece na landing */
      }
    }

    redirectIfPremium();

    return () => {
      active = false;
    };
  }, [router]);

  return null;
}
