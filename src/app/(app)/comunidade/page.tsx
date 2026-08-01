export const dynamic = "force-dynamic";

import { Suspense } from "react";
import ComunidadeDocenteClient from "@/components/community/docente/ComunidadeDocenteClient";

export default function ComunidadePage() {
  return (
    <Suspense>
        <ComunidadeDocenteClient />
      </Suspense>
  );
}
