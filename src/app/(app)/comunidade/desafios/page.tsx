export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { ComunidadeDocenteDesafiosPageClient } from "@/components/community/docente/ComunidadeDocenteDesafiosPageClient";

export default function DesafiosPage() {
  return (
    <Suspense>
        <ComunidadeDocenteDesafiosPageClient />
      </Suspense>
  );
}
