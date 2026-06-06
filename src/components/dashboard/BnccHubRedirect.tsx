"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlanifyToolRedirectShell } from "@/components/dashboard/PlanifyToolRedirectShell";

export default function BnccHubRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("secao");
    const qs = params.toString();
    router.replace(qs ? `/progresso-bncc?${qs}` : "/progresso-bncc", {
      scroll: false,
    });
  }, [router, searchParams]);

  return <PlanifyToolRedirectShell message="Abrindo Progresso BNCC…" />;
}
