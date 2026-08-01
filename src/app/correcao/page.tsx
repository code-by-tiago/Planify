"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlanifyToolRedirectShell } from "@/components/dashboard/PlanifyToolRedirectShell";

export default function CorrecaoRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard?tipo=correcao-ia&mode=upload", { scroll: false });
  }, [router]);

  return <PlanifyToolRedirectShell />;
}
