"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlanifyToolRedirectShell } from "@/components/dashboard/PlanifyToolRedirectShell";

export default function BancoQuestoesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard?secao=banco-questoes", { scroll: false });
  }, [router]);

  return <PlanifyToolRedirectShell />;
}
