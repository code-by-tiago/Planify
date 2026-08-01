export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { ComunidadeDocenteBuscaClient } from "@/components/community/docente/ComunidadeDocenteBuscaClient";

export default function BuscaProfessoresPage() {
  return (
    <Suspense>
        <ComunidadeDocenteBuscaClient />
      </Suspense>
  );
}
