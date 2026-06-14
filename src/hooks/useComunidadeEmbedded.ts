"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { resolveComunidadeEmbedFromLocation } from "@/lib/community/docente-utils";

export function useComunidadeEmbedded(forceEmbedded?: boolean): boolean {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return resolveComunidadeEmbedFromLocation(pathname, searchParams, forceEmbedded);
}
