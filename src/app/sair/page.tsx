import { PageShell } from "../../components/PageShell";
import { SairClient } from "./SairClient";

export const dynamic = "force-dynamic";

export default function SairPage() {
  return (
    <PageShell>
      <SairClient />
    </PageShell>
  );
}
