"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlanifyToolRedirectShell } from "@/components/dashboard/PlanifyToolRedirectShell";

export default function ApostilasComIaRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard", { scroll: false });
  }, [router]);

  return <PlanifyToolRedirectShell />;
}
