"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlanifyToolRedirectShell } from "@/components/dashboard/PlanifyToolRedirectShell";

/** Redireciona /inclusao para o painel único (/dashboard?tipo=inclusao). */
export default function InclusaoRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard?tipo=inclusao", { scroll: false });
  }, [router]);

  return <PlanifyToolRedirectShell />;
}
