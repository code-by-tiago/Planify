"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlanifyToolRedirectShell } from "@/components/dashboard/PlanifyToolRedirectShell";

export default function AulaCompletaRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard?tipo=aula-completa", { scroll: false });
  }, [router]);

  return <PlanifyToolRedirectShell />;
}
