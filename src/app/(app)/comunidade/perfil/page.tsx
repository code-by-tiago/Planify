export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { ComunidadeMeuPerfilClient } from "@/components/community/docente/ComunidadeMeuPerfilClient";

export default function MeuPerfilPage() {
  return (
    <Suspense>
      <ComunidadeMeuPerfilClient />
    </Suspense>
  );
}
