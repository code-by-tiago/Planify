"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchFullPlanifyAccessStatus } from "@/lib/auth/access-client";

/**
 * Em usuários premium autenticados, envia da landing para o painel (/dashboard).
 */
export default function StudioSessionRedirect() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function redirectIfPremium() {
      try {
        const data = await fetchFullPlanifyAccessStatus();
        if (!active) return;

        if (data.authenticated && data.premium) {
          const search =
            typeof window !== "undefined" ? window.location.search : "";
          router.replace(search ? `/dashboard${search}` : "/dashboard");
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
